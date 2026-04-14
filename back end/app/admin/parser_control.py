import enum
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class ParserState(enum.Enum):
    RUNNING = "running"
    STOPPED = "stopped"
    EMERGENCY = "emergency"  # critical stop — needs manual review


# Global parser state (in production, use Redis for distributed state)
_parser_state = ParserState.RUNNING


def get_parser_state() -> ParserState:
    return _parser_state


def set_parser_state(state: ParserState) -> bool:
    global _parser_state
    old_state = _parser_state
    _parser_state = state
    logger.warning("Parser state changed: %s -> %s", old_state.value, state.value)
    return True


def can_parse() -> bool:
    """Check if parsing is currently allowed."""
    return _parser_state == ParserState.RUNNING


def is_emergency() -> bool:
    """Check if parser is in emergency stop mode."""
    return _parser_state == ParserState.EMERGENCY


class SourceControl:
    """Control individual parser sources."""

    # Track which sources are enabled/disabled
    _disabled_sources: set[str] = set()
    _emergency_sources: set[str] = set()

    @classmethod
    def disable_source(cls, source_name: str) -> bool:
        """Pause a specific source (e.g., it's returning garbage)."""
        cls._disabled_sources.add(source_name)
        cls._emergency_sources.discard(source_name)
        logger.info("Source disabled: %s", source_name)
        return True

    @classmethod
    def enable_source(cls, source_name: str) -> bool:
        """Re-enable a paused source."""
        cls._disabled_sources.discard(source_name)
        cls._emergency_sources.discard(source_name)
        logger.info("Source enabled: %s", source_name)
        return True

    @classmethod
    def emergency_stop_source(cls, source_name: str) -> bool:
        """Emergency stop a source — marks it as producing bad data."""
        cls._emergency_sources.add(source_name)
        cls._disabled_sources.discard(source_name)
        logger.critical("EMERGENCY STOP source: %s", source_name)
        return True

    @classmethod
    def is_source_active(cls, source_name: str) -> bool:
        return source_name not in cls._disabled_sources and source_name not in cls._emergency_sources

    @classmethod
    def is_source_emergency(cls, source_name: str) -> bool:
        return source_name in cls._emergency_sources

    @classmethod
    def get_all_sources_status(cls) -> dict:
        all_sources = set()
        all_sources.update(cls._disabled_sources)
        all_sources.update(cls._emergency_sources)

        # Also add known sources
        from app.parsers.registry import ParserRegistry
        for ch in ParserRegistry.get_channels():
            all_sources.add(f"tg:{ch}")
        for url in ParserRegistry.get_websites():
            all_sources.add(f"web:{url}")

        status = {}
        for s in sorted(all_sources):
            if s in cls._emergency_sources:
                status[s] = "emergency"
            elif s in cls._disabled_sources:
                status[s] = "disabled"
            else:
                status[s] = "active"
        return status
