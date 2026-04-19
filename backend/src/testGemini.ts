import dotenv from "dotenv";
dotenv.config();

// अगर Node < 18 है तो ये install करके uncomment करो
// import fetch from "node-fetch";

async function testLLM() {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY not found in .env");
    }

    console.log("API KEY LOADED:", apiKey.slice(0, 10) + "...");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "user",
            content: "hii"
          }
        ]
      })
    });

    const data = await response.json();

    // 🔍 FULL DEBUG
    console.log("\n🔍 FULL RESPONSE:");
    console.log(JSON.stringify(data, null, 2));

    // 🧠 UNIVERSAL PARSE
    const content =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text ||
      data.choices?.[0]?.delta?.content ||
      "❌ No content found";

    console.log("\n✅ FINAL OUTPUT:");
    console.log(content);

  } catch (error) {
    console.error("❌ ERROR:", error);
  }
}

testLLM();