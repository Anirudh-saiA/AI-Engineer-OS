import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class DBWorkflowState(Base):
    """
    Persists intermediate workflow states at each agent transition.
    Enables workflow recovery, auditing, and visual timelines.
    """
    __tablename__ = "workflow_states"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    workflow_id = Column(String, ForeignKey("workflows.id", ondelete="CASCADE"), index=True, nullable=False)
    agent_id = Column(String, index=True, nullable=False)
    state_snapshot = Column(JSON, nullable=False)  # Serialized dictionary of AgentState
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship to the parent workflow
    workflow = relationship("DBWorkflow")


class DBSharedMemory(Base):
    """
    Stores key-value memory entries linked to a specific workflow execution.
    Categories include: goals, context, outputs, decisions, knowledge, requirements, history.
    """
    __tablename__ = "shared_memory"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    workflow_id = Column(String, ForeignKey("workflows.id", ondelete="CASCADE"), index=True, nullable=False)
    category = Column(String, index=True, nullable=False)  # goals, context, outputs, decisions, etc.
    memory_key = Column(String, index=True, nullable=False)
    memory_value = Column(Text, nullable=False)            # Serialized representation or plain text
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationship to the parent workflow
    workflow = relationship("DBWorkflow")
