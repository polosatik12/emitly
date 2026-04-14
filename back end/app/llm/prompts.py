PROCESS_NEWS_PROMPT = """\
You are a financial news processing assistant. Process the following Russian stock market news article.

Tasks:
1. Clean the text: remove HTML artifacts, excessive whitespace, emojis, junk characters, ad banners, and navigation text.
2. Rewrite for clarity while preserving the original meaning, facts, and numbers.
3. Detect any mentioned tickers from the Russian stock market (MOEX/SPB Exchange).

Respond ONLY with a valid JSON object in this exact format:
{{
    "cleaned_text": "The cleaned and rewritten article text",
    "detected_tickers": ["TICKER1", "TICKER2"],
    "is_summary": true/false
}}

Rules:
- detected_tickers should only contain valid Russian stock tickers (e.g., SBER, GAZP, LKOH, GMKN, YDEX, T, VTBR, etc.)
- is_summary should be true if the text is a short summary or digest, false if it's a full article
- If no tickers are detected, return an empty list
- Do not include any text outside the JSON object

Here is the raw article text:

{raw_text}
"""

EMITTER_DETECT_PROMPT = """\
You are a financial entity detection assistant. Analyze the following text and identify all Russian stock market companies, banks, financial institutions, or tickers mentioned.

Respond ONLY with a valid JSON object in this exact format:
{{
    "entities": [
        {{"name": "Company Name", "ticker": "TICKER", "confidence": 0.95}},
        {{"name": "Company Name", "ticker": "TICKER", "confidence": 0.80}}
    ]
}}

Rules:
- confidence should be between 0.0 and 1.0
- Higher confidence (0.90+) when the exact ticker symbol is mentioned
- Medium confidence (0.70-0.89) when only the company name is mentioned
- Lower confidence (0.50-0.69) when the entity is referenced indirectly
- Do not include any text outside the JSON object

Here is the text:

{text}
"""

DUPLICATE_CHECK_PROMPT = """\
Compare the following two news articles and determine if they are about the same event or are duplicates.

Respond ONLY with a valid JSON object:
{{
    "is_duplicate": true/false,
    "similarity_score": 0.85
}}

Rules:
- is_duplicate should be true if both texts describe the same event/news (even with different wording)
- similarity_score should be between 0.0 (completely different) and 1.0 (nearly identical)
- Consider them duplicates if they cover the same core event, even if one is longer
- Do not include any text outside the JSON object

Text 1:
{text1}

Text 2:
{text2}
"""
