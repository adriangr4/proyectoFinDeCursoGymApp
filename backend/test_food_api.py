import requests

def test():
    url = "https://world.openfoodfacts.org/cgi/search.pl"
    params = {
        "search_terms": "banana",
        "search_simple": 1,
        "action": "process",
        "json": 1,
        "page": 1,
        "page_size": 2
    }
    
    headers = {
        "User-Agent": "PostmanRuntime/7.29.2",
        "Accept": "*/*"
    }
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=5.0)
        print("Status", response.status_code)
        response.raise_for_status()
        print(response.json())
    except Exception as e:
        print("ERROR:", repr(e))

if __name__ == "__main__":
    test()
