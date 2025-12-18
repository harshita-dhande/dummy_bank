# backend/app/schemas.py
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class AccountBase(BaseModel):
    account_type: str = "Savings"
    currency: str = "INR"

class AccountCreate(AccountBase):
    user_id: int

class Account(AccountBase):
    id: int
    account_number: str
    balance: float
    created_at: datetime
    
    class Config:
        from_attributes = True

class TransactionBase(BaseModel):
    transaction_type: str
    amount: float
    description: Optional[str] = None
    to_account: Optional[str] = None

class TransactionCreate(TransactionBase):
    user_id: int
    account_id: int

class Transaction(TransactionBase):
    id: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class DigitalGoldBase(BaseModel):
    grams: float

class DigitalGold(DigitalGoldBase):
    id: int
    current_value: float
    last_updated: datetime
    
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class InvestRequest(BaseModel):
    amount: float
    investment_type: str = "digital_gold"