import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
import pickle

print("Loading dataset...")

# load dataset
df = pd.read_csv("startup_data.csv")

print("Dataset shape:", df.shape)

# target variable
y = df["labels"]

# remove text columns that ML cannot use
# keep only numeric columns automatically
X = df.select_dtypes(include=["int64", "float64"])

# remove target column from features
X = X.drop(columns=["labels"], errors="ignore")

# fill missing values
X = X.fillna(0)

print("Training model...")

# split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# logistic regression model
model = LogisticRegression(max_iter=2000)

model.fit(X_train, y_train)

print("Saving model...")

# save model
pickle.dump(model, open("startup_model.pkl", "wb"))

print("Model saved as startup_model.pkl")