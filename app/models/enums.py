import enum


class UserRole(str, enum.Enum):
    buyer = "buyer"
    admin = "admin"


class OrderStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class PaymentMethod(str, enum.Enum):
    COD = "COD"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"

