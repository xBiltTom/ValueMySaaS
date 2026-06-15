import httpx

TOKEN = "W1OEcM2rmZf5gTU8kZijgPPcCGHhSd6DvZ9fHx2hczhkAOXlQdewru/V8wARIu8Y"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Origin": "https://chat.deepseek.com",
    "Referer": "https://chat.deepseek.com/",
    "x-app-version": "2.0.0",
    "x-client-locale": "en_US",
    "x-client-platform": "web",
    "x-client-timezone-offset": "-18000",
    "x-client-version": "2.0.0",
}

def test_deepseek():
    # 1. Create a session
    print("Creating chat session...")
    resp = httpx.post(
        "https://chat.deepseek.com/api/v0/chat_session/create",
        headers=headers,
        json={"character_class": None}
    )
    if resp.status_code != 200:
        print("Failed to create session:", resp.status_code, resp.text)
        return
        
    data = resp.json()
    print("Session Response:", data)
    session_id = data.get("data", {}).get("biz_data", {}).get("chat_session", {}).get("id") or data.get("data", {}).get("biz_data", {}).get("id")
    if not session_id:
        print("No session ID found")
        return
        
    print(f"Got session ID: {session_id}")
    
    # 2. Send message
    print("Sending message...")
    payload = {
        "chat_session_id": session_id,
        "parent_message_id": None,
        "prompt": "Hola, ¿estás vivo?",
        "ref_file_ids": [],
        "thinking_enabled": False
    }
    
    with httpx.stream("POST", "https://chat.deepseek.com/api/v0/chat/completion", headers=headers, json=payload) as r:
        if r.status_code != 200:
            print("Failed to send message:", r.status_code, r.read().decode())
            return
            
        print("Response stream:")
        for chunk in r.iter_text():
            print(chunk, end="", flush=True)

if __name__ == "__main__":
    test_deepseek()
