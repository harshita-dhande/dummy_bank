# backend/app/routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import random
import string
from datetime import datetime

from app import models, schemas
from app.database import get_db
from app.auth import get_current_user, create_access_token

router = APIRouter()

# Helper function to generate account number
def generate_account_number():
    return ''.join(random.choices(string.digits, k=12))

# Auth routes
@router.post("/auth/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(models.User).filter(
        (models.User.username == user.username) | 
        (models.User.email == user.email)
    ).first()
    
    if db_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    # Create new user
    db_user = models.User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=user.password  # In real app, hash this!
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create default account for user
    account = models.Account(
        user_id=db_user.id,
        account_number=generate_account_number(),
        account_type="Savings",
        balance=10000.0  # Starting balance for demo
    )
    db.add(account)
    db.commit()
    
    return db_user

@router.post("/auth/login", response_model=schemas.Token)
def login(login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    # Simple auth for demo (in real app, use proper hashing)
    user = db.query(models.User).filter(
        models.User.username == login_data.username,
        models.User.hashed_password == login_data.password
    ).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# Account routes
@router.get("/accounts", response_model=List[schemas.Account])
def get_user_accounts(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    accounts = db.query(models.Account).filter(
        models.Account.user_id == current_user.id
    ).all()
    return accounts

@router.get("/accounts/{account_id}", response_model=schemas.Account)
def get_account(
    account_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    account = db.query(models.Account).filter(
        models.Account.id == account_id,
        models.Account.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    return account

# Transaction routes
@router.post("/transactions/deposit")
def deposit(
    transaction: schemas.TransactionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify account belongs to user
    account = db.query(models.Account).filter(
        models.Account.id == transaction.account_id,
        models.Account.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Update balance
    account.balance += transaction.amount
    
    # Create transaction record
    db_transaction = models.Transaction(
        **transaction.dict(),
        status="completed"
    )
    db.add(db_transaction)
    db.commit()
    
    return {"message": "Deposit successful", "new_balance": account.balance}

@router.post("/transactions/withdraw")
def withdraw(
    transaction: schemas.TransactionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    account = db.query(models.Account).filter(
        models.Account.id == transaction.account_id,
        models.Account.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if account.balance < transaction.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    
    # Update balance
    account.balance -= transaction.amount
    
    # Create transaction record
    db_transaction = models.Transaction(
        **transaction.dict(),
        status="completed"
    )
    db.add(db_transaction)
    db.commit()
    
    return {"message": "Withdrawal successful", "new_balance": account.balance}

@router.post("/transactions/transfer")
def transfer(
    transaction: schemas.TransactionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not transaction.to_account:
        raise HTTPException(status_code=400, detail="Recipient account required")
    
    # Get sender account
    from_account = db.query(models.Account).filter(
        models.Account.id == transaction.account_id,
        models.Account.user_id == current_user.id
    ).first()
    
    if not from_account:
        raise HTTPException(status_code=404, detail="Sender account not found")
    
    # Get recipient account
    to_account = db.query(models.Account).filter(
        models.Account.account_number == transaction.to_account
    ).first()
    
    if not to_account:
        raise HTTPException(status_code=404, detail="Recipient account not found")
    
    if from_account.balance < transaction.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    
    # Perform transfer
    from_account.balance -= transaction.amount
    to_account.balance += transaction.amount
    
    # Create transaction records for both accounts
    sender_transaction = models.Transaction(
        user_id=current_user.id,
        account_id=from_account.id,
        transaction_type="transfer_out",
        amount=transaction.amount,
        description=f"Transfer to {transaction.to_account}",
        to_account=transaction.to_account,
        status="completed"
    )
    
    receiver_transaction = models.Transaction(
        user_id=to_account.user_id,
        account_id=to_account.id,
        transaction_type="transfer_in",
        amount=transaction.amount,
        description=f"Transfer from {from_account.account_number}",
        status="completed"
    )
    
    db.add(sender_transaction)
    db.add(receiver_transaction)
    db.commit()
    
    return {"message": "Transfer successful", "new_balance": from_account.balance}

# Investment routes (Digital Gold)
@router.get("/investments/digital-gold")
def get_digital_gold_holdings(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    holdings = db.query(models.DigitalGoldHolding).filter(
        models.DigitalGoldHolding.user_id == current_user.id
    ).first()
    
    if not holdings:
        # Create if doesn't exist
        holdings = models.DigitalGoldHolding(
            user_id=current_user.id,
            grams=0.0,
            current_value=0.0
        )
        db.add(holdings)
        db.commit()
        db.refresh(holdings)
    
    return holdings

@router.post("/investments/digital-gold/buy")
def buy_digital_gold(
    invest_request: schemas.InvestRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get user's primary account
    account = db.query(models.Account).filter(
        models.Account.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if account.balance < invest_request.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    
    # Gold price (simplified - ₹5000 per gram)
    gold_price_per_gram = 5000
    grams_bought = invest_request.amount / gold_price_per_gram
    
    # Update account balance
    account.balance -= invest_request.amount
    
    # Update or create digital gold holdings
    holdings = db.query(models.DigitalGoldHolding).filter(
        models.DigitalGoldHolding.user_id == current_user.id
    ).first()
    
    if not holdings:
        holdings = models.DigitalGoldHolding(
            user_id=current_user.id,
            grams=grams_bought,
            current_value=invest_request.amount
        )
    else:
        holdings.grams += grams_bought
        holdings.current_value += invest_request.amount
    
    holdings.last_updated = datetime.now()
    
    # Create transaction record
    transaction = models.Transaction(
        user_id=current_user.id,
        account_id=account.id,
        transaction_type="investment",
        amount=invest_request.amount,
        description=f"Bought {grams_bought:.4f}g Digital Gold",
        status="pending"  # Will need approval
    )
    
    db.add(transaction)
    db.commit()
    
    return {
        "message": "Investment initiated",
        "grams_bought": grams_bought,
        "new_balance": account.balance,
        "total_gold_grams": holdings.grams,
        "transaction_id": transaction.id,
        "status": "pending_approval"  # For the "Conscious Pause"
    }

@router.post("/transactions/{transaction_id}/approve")
def approve_transaction(
    transaction_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    transaction.status = "completed"
    db.commit()
    
    return {"message": "Transaction approved and completed"}

# Dashboard data
@router.get("/dashboard")
def get_dashboard(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    accounts = db.query(models.Account).filter(
        models.Account.user_id == current_user.id
    ).all()
    
    total_balance = sum(acc.balance for acc in accounts)
    
    transactions = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id
    ).order_by(models.Transaction.created_at.desc()).limit(10).all()
    
    gold_holdings = db.query(models.DigitalGoldHolding).filter(
        models.DigitalGoldHolding.user_id == current_user.id
    ).first()
    
    return {
        "total_balance": total_balance,
        "accounts": accounts,
        "recent_transactions": transactions,
        "digital_gold": gold_holdings,
        "user": {
            "name": current_user.full_name or current_user.username,
            "email": current_user.email
        }
    }