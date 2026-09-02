"""
VIGIL-FLOOD: PyTorch Bi-LSTM Deep Learning Time-Series Model
Learns multi-hour storm sequences (t-6h to t) to predict continuous flood & landslide trajectories.
"""

import os
import time
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_squared_error

# 1. Feature Columns
FEATURES = [
    "rain_1h", "rain_3h", "rain_6h", "rain_24h", "forecast_rain_3h",
    "soil_moisture", "water_level_m", "water_level_rise_rate",
    "slope_deg", "elevation_m", "distance_to_stream_m",
    "historical_flood_count", "historical_landslide_count"
]

TARGETS = ["flood_risk_score", "landslide_risk_score"]
SEQ_LEN = 6  # 6-Hour Temporal Lookback Window
DATA_PATH = "backend/data/real_multisource_training_data.csv"
MODEL_PATH = "backend/saved_models/bilstm_temporal_model.pt"

# 2. PyTorch Bi-LSTM Neural Network Architecture
class FloodBiLSTM(nn.Module):
    def __init__(self, input_dim=13, hidden_dim=64, num_layers=2, output_dim=2):
        super(FloodBiLSTM, self).__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        
        # Bidirectional LSTM (processes forward & backward storm context)
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=0.2 if num_layers > 1 else 0.0
        )
        
        # Dense Regression Head
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim * 2, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, output_dim),
            nn.Sigmoid()  # Bounds risk output between 0.0 and 1.0
        )
        
    def forward(self, x):
        # x shape: (batch_size, seq_len, input_dim)
        lstm_out, _ = self.lstm(x)
        # Take the final hidden state output of the sequence
        last_time_step = lstm_out[:, -1, :]  # shape: (batch_size, hidden_dim * 2)
        out = self.fc(last_time_step)
        return out

# 3. Time-Series Sliding Window Dataset
class TimeSeriesFloodDataset(Dataset):
    def __init__(self, sequences, targets):
        self.sequences = torch.tensor(sequences, dtype=torch.float32)
        self.targets = torch.tensor(targets, dtype=torch.float32)
        
    def __len__(self):
        return len(self.sequences)
        
    def __getitem__(self, idx):
        return self.sequences[idx], self.targets[idx]

def create_sequences(df, seq_len=6):
    """Generates (N, seq_len, features) sliding windows for each mountain basin."""
    df = df.reset_index(drop=True)
    sequences = []
    targets = []
    
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(df[FEATURES])
    df_scaled = pd.DataFrame(scaled_features, columns=FEATURES)
    df_scaled["basin_name"] = df["basin_name"].values
    df_scaled["flood_risk_score"] = df["flood_risk_score"].values
    df_scaled["landslide_risk_score"] = df["landslide_risk_score"].values
    
    # Process each basin independently so windows don't cross basins
    for basin, group in df_scaled.groupby("basin_name"):
        feat_matrix = group[FEATURES].values
        target_matrix = group[TARGETS].values
        
        for i in range(len(feat_matrix) - seq_len):
            seq = feat_matrix[i:i + seq_len]
            targ = target_matrix[i + seq_len]
            sequences.append(seq)
            targets.append(targ)
            
    return np.array(sequences), np.array(targets), scaler

def main():
    print("=" * 65)
    print("VIGIL-FLOOD: PYTORCH Bi-LSTM TEMPORAL SEQUENCE TRAINING")
    print("=" * 65)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training Device: {device} ({torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'})")
    
    if not os.path.exists(DATA_PATH):
        print(f"[!] Dataset not found at {DATA_PATH}")
        return
        
    print(f"[*] Loading dataset and creating 6-hour sliding sequences...")
    df = pd.read_csv(DATA_PATH)
    
    # Use 100,000 temporal samples for fast convergence
    df_sample = df.tail(100000) if len(df) > 100000 else df
    X_seq, y_targ, scaler = create_sequences(df_sample, seq_len=SEQ_LEN)
    print(f"    Generated {len(X_seq):,} time-series sequences of shape (6h x 13 features).")
    
    # Split Train (80%) / Test (20%)
    split_idx = int(len(X_seq) * 0.8)
    train_dataset = TimeSeriesFloodDataset(X_seq[:split_idx], y_targ[:split_idx])
    test_dataset = TimeSeriesFloodDataset(X_seq[split_idx:], y_targ[split_idx:])
    
    train_loader = DataLoader(train_dataset, batch_size=256, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=512, shuffle=False)
    
    model = FloodBiLSTM(input_dim=13, hidden_dim=64, num_layers=2, output_dim=2).to(device)
    criterion = nn.MSELoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.002, weight_decay=1e-4)
    
    epochs = 10
    print(f"[*] Starting training across {epochs} epochs...")
    start_t = time.time()
    
    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            
            optimizer.zero_grad()
            preds = model(batch_x)
            loss = criterion(preds, batch_y)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(batch_x)
            
        train_loss /= len(train_dataset)
        
        # Validation
        model.eval()
        test_loss = 0.0
        with torch.no_grad():
            for batch_x, batch_y in test_loader:
                batch_x, batch_y = batch_x.to(device), batch_y.to(device)
                preds = model(batch_x)
                loss = criterion(preds, batch_y)
                test_loss += loss.item() * len(batch_x)
        test_loss /= len(test_dataset)
        
        print(f"    Epoch [{epoch:02d}/{epochs:02d}] | Train MSE: {train_loss:.5f} | Val MSE: {test_loss:.5f}")
        
    duration = time.time() - start_t
    print(f"[+] Training completed in {duration:.2f} seconds!")
    
    # Final Benchmark
    model.eval()
    all_preds, all_trues = [], []
    with torch.no_grad():
        for batch_x, batch_y in test_loader:
            batch_x = batch_x.to(device)
            preds = model(batch_x).cpu().numpy()
            all_preds.append(preds)
            all_trues.append(batch_y.numpy())
            
    all_preds = np.vstack(all_preds)
    all_trues = np.vstack(all_trues)
    
    r2_flood = r2_score(all_trues[:, 0], all_preds[:, 0])
    r2_slide = r2_score(all_trues[:, 1], all_preds[:, 1])
    
    print("\n" + "=" * 65)
    print("PYTORCH Bi-LSTM MODEL EVALUATION BENCHMARK:")
    print(f"• Flash Flood Inundation R² Accuracy:   {r2_flood * 100:.2f}%")
    print(f"• Slope Failure / Debris R² Accuracy:   {r2_slide * 100:.2f}%")
    print(f"• Temporal Sequence Lookback:           6 Consecutive Hours")
    print("=" * 65)
    
    # Save Model & Scaler
    os.makedirs("backend/saved_models", exist_ok=True)
    torch.save({
        "model_state_dict": model.state_dict(),
        "input_dim": 13,
        "hidden_dim": 64,
        "num_layers": 2,
        "output_dim": 2,
        "seq_len": SEQ_LEN
    }, MODEL_PATH)
    
    import pickle
    with open("backend/saved_models/bilstm_scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)
        
    print(f"[+] Saved Deep Learning Weights to: {MODEL_PATH}")

if __name__ == "__main__":
    main()
