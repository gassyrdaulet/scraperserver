const signInKaspiMerchant = async (username, password) => {
  const getCookieFromResult = (cookies) => {
    for (let cookie of cookies) {
      if (cookie.name === "X-Mc-Api-Session-Id") {
        return `${cookie.name}=${cookie.value}`;
      }
    }
    throw new Error(
      "Не удалось получить Cookie при входе в Кабинет продавца. Скорее всего неправильный логин, пароль или код."
    );
  };
  if (viaEmail) {
    const loginResult = await axios.post(
      kaspiMerchantSignInUrl,
      {
        username,
        password,
      },
      { headers: kaspiMerchantSignInHeaders }
    );
    const cookies = setCookie.parse(loginResult);
    return getCookieFromResult(cookies);
  } else {
    const sendCodeResult = await axios.post(
      kaspiMerchantSendCodeUrl,
      `phone=${cellphone}`,
      {
        headers: kaspiMerchantSignInHeaders,
      }
    );
    const sendCodeCookies = setCookie.parse(sendCodeResult);
    const sendCodeCookie = getCookieFromResult(sendCodeCookies);
    const { code } = await inquirer.prompt([
      {
        type: "input",
        name: "code",
        message: "Введите четыврехзначный код:",
        validate: (v) =>
          v.match(/^[0-9]{4}$/)
            ? true
            : "Пожалуйста, введите четырехзначный код.",
      },
    ]);
    const loginResult = await axios.post(
      kaspiMerchantSecurityCodeUrl,
      `securityCode=${code}`,
      {
        headers: {
          cookie: sendCodeCookie,
        },
      }
    );
    const cookies = setCookie.parse(loginResult);
    return getCookieFromResult(cookies);
  }
};

const getOffersKaspiMerchant = async (cookie, kaspiMerchantId) => {
  const prices = [];
  const maxOffersLimit = 100;

  const getOffers = async (p = 0, l = maxOffersLimit) => {
    const resultFetch = await fetch(
      kaspiMerchantOffersUrl +
        new URLSearchParams({
          m: kaspiMerchantId,
          p,
          l,
          a: true,
          t: "",
        }),
      {
        headers: {
          ...kaspiMerchantOffersHeaders,
          cookie,
        },
        method: "GET",
      }
    );
    const prices = await resultFetch.json();
    return prices;
  };
  const { total } = await getOffers(0, 1);
  for (let i = 0; i < total; i = i + maxOffersLimit) {
    const { data } = await getOffers(Math.ceil(i / maxOffersLimit));
    prices.push(...data);
  }
  return prices.filter((item) => item.available);
};
