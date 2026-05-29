import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text
from app.db.base_class import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, index=True, nullable=False) # Firebase User UID
    name = Column(String, nullable=False) # filename
    source_type = Column(String, nullable=False) # 'pdf', 'txt', 'md', 'paper'
    topic = Column(String, nullable=True)
    content = Column(Text, nullable=False) # extracted text content
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
