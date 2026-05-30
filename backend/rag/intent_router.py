"""
Intent detection module for the hybrid chatbot.
Detects user intent from messages and routes to appropriate handlers.
"""

from typing import Literal


def detect_intent(message: str) -> Literal["greeting", "thanks", "bye", "help", "legal"]:
    """
    Detect user intent from a message.
    
    Args:
        message: User input message
        
    Returns:
        Intent type: "greeting", "thanks", "bye", "help", or "legal"
    """
    msg = message.lower().strip()
    
    # Greeting patterns - support exact phrases and contain patterns
    greeting_patterns = [
        "hi", "hello", "hey",
        "good morning", "good afternoon", "good evening",
        "hii", "helo", "hallo",  # Common typos
        "greetings", "howdy",
        "namaste"
    ]
    
    # Check for greeting patterns (both exact and contains)
    if any(pattern in msg for pattern in greeting_patterns):
        return "greeting"
    
    # Thanks patterns - support exact phrases and variations
    thanks_patterns = [
        "thanks", "thank you", "thx",
        "thank", "appreciate", "grateful",
        "much obliged", "thankful"
    ]
    
    if any(pattern in msg for pattern in thanks_patterns):
        return "thanks"
    
    # Bye patterns
    bye_patterns = [
        "bye", "goodbye", "see you",
        "farewell", "take care", "catch you",
        "till then", "see ya", "gotta go",
        "have to go", "cya","by","byy"
    ]
    
    if any(pattern in msg for pattern in bye_patterns):
        return "bye"
    
    # Help/Introduction patterns
    help_patterns = [
        "what can you do",
        "help",
        "who are you",
        "what are you",
        "tell me about yourself",
        "capabilities",
        "what can i ask you",
        "what do you do"
    ]
    
    if any(pattern in msg for pattern in help_patterns):
        return "help"
    
    # Default to legal - all other messages go through RAG
    return "legal"