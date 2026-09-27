from aiogram.fsm.state import State, StatesGroup


class Connect(StatesGroup):
    token = State()      # منتظر توکن ربات مشتری


class Welcome(StatesGroup):
    text = State()       # منتظر متن پیام خوش آمد ربات مشتری
