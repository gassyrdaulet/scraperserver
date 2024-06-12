import config from "./config.json" assert { type: "json" };
import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

const { proxyConfig } = config;

const httpsAgent = new HttpsProxyAgent(proxyConfig.url);

const getMerchantInfo = async (merchantId) => {
  const formatPhoneNumber = (phoneNumber) => {
    const digits = phoneNumber.replace(/\D/g, "");
    const formattedNumber = digits.startsWith("7")
      ? "8" + digits.slice(1)
      : digits;
    return formattedNumber;
  };
  const { data } = await axios.get(
    `https://kaspi.kz/shop/info/merchant/${merchantId}/address-tab/`,
    {
      httpsAgent,
      baseURL: proxyConfig.url,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
      },
    }
  );
  const html_string = data;
  const phoneRegex = /\+\d{1,3}\s*\(\d{3}\)\s*\d{3}-\d{2}-\d{2}/;
  const phoneNumber = html_string.match(phoneRegex);
  if (!phoneNumber) {
    const error = new Error(`Ошибка при поиске номера телефона`);
    throw error;
  }
  const nameRegex = /"name":\s*"([^"]+)",/g;
  const names = [...html_string.matchAll(nameRegex)];
  if (names <= 0) {
    const error = new Error(`Ошибка при поиске названия магазина`);
    throw error;
  }
  return {
    phone: formatPhoneNumber(phoneNumber[0]),
    name: names[names.length - 1][1],
  };
};

console.log(await getMerchantInfo("15503068"));
