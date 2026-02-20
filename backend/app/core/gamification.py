from math import floor

def calculate_level(xp: int) -> int:
    """
    Calculate level based on XP.
    Formula: XP = Level * 100 * 1.2 (Cumulative? Or per level?)
    Let's use a simple cumulative formula for stability:
    Level N requires around (N^2) * 100 XP
    Or simpler: Level = floor(sqrt(XP / 100)) + 1
    
    Reverse: XP required for Level L = (L-1)^2 * 100
    
    Example:
    XP 0 -> Lvl 1
    XP 100 -> Lvl 2
    XP 400 -> Lvl 3
    XP 900 -> Lvl 4
    
    User asked for "Level 100 or +".
    Lvl 100 would be 99^2 * 100 = 980,100 XP. Achievable over long term.
    """
    if xp < 0: return 1
    return floor((xp / 100) ** 0.5) + 1

def calculate_xp_for_next_level(level: int) -> int:
    """
    Calculate total XP required to reach the NEXT level.
    """
    return (level) ** 2 * 100

def get_rank(level: int) -> str:
    """
    Get rank based on Level.
    Bronze: 1-10
    Silver: 11-30
    Gold: 31-50
    Platinum: 51-70
    Diamond: 71-90
    Champion: 91+
    """
    if level < 11: return "Bronze"
    if level < 31: return "Silver"
    if level < 51: return "Gold"
    if level < 71: return "Platinum"
    if level < 91: return "Diamond"
    return "Champion"
