import re
from app.emitters.tickers import TICKERS


class EmitterMatcher:
    """Matches tickers to text using keyword matching."""

    def __init__(self, tickers: list[dict] | None = None):
        self.tickers = tickers or TICKERS
        self._index = self._build_index()

    def _build_index(self) -> list[tuple[str, str, float]]:
        """Build searchable index of ticker -> aliases with confidence."""
        index = []
        for t in self.tickers:
            # Exact ticker symbol = highest confidence
            index.append((t["ticker"].upper(), t["ticker"], 0.95))
            for alias in t.get("aliases", []):
                conf = 0.95 if alias.upper() == t["ticker"].upper() else 0.80
                index.append((alias.upper(), t["ticker"], conf))
        return index

    def match(self, text: str) -> list[tuple[str, float]]:
        """Match tickers in text. Returns sorted list of (ticker, confidence)."""
        text_upper = text.upper()
        results: dict[str, float] = {}

        for keyword, ticker, confidence in self._index:
            if keyword in text_upper:
                # Verify it's a word boundary match for short tickers
                if len(keyword) <= 4:
                    pattern = re.compile(r'\b' + re.escape(keyword) + r'\b')
                    if not pattern.search(text_upper):
                        continue

                current = results.get(ticker, 0.0)
                results[ticker] = max(current, confidence)

        sorted_results = sorted(results.items(), key=lambda x: -x[1])
        return sorted_results
