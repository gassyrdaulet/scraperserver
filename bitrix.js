import config from "./bitrix.json" assert { type: "json" };

const { url } = config;

const getMerchantInfo = async (merchantId) => {
  const formatPhoneNumber = (phoneNumber) => {
    const digits = phoneNumber.replace(/\D/g, "");
    const formattedNumber = digits.startsWith("7")
      ? "8" + digits.slice(1)
      : digits;
    return formattedNumber;
  };
  const data = await fetch(
    `https://kaspi.kz/shop/info/merchant/${merchantId}/address-tab/`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
      },
      body: null,
      method: "GET",
    }
  );
  if (!data.ok) {
    const error = new Error(`Ошибка при получении номера продавца`);
    throw error;
  }
  const html_string = await data.text();
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

export const publishDeal = async (days, storeId, productId) => {
  let merchantData = {};
  try {
    merchantData = await getMerchantInfo(storeId);
  } catch (e) {
    throw e;
  }
  const addContact = await fetch(url + "crm.contact.add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        NAME: merchantData.name,
        PHONE: [{ VALUE: merchantData.phone, VALUE_TYPE: "WORK" }],
        UF_CRM_1716121904346: storeId,
      },
    }),
  });
  const contact = await addContact.json();
  const { result: contactId } = contact;
  if (!addContact.ok) {
    const error = new Error("Ошибка при попытке создания контакта в Битрикс");
    throw error;
  }
  const getPrice = await fetch(url + "catalog.price.get?id=" + productId, {
    method: "GET",
  });
  const { result } = await getPrice.json();
  const { price: PRICE } = result.price;
  if (!getPrice.ok) {
    const error = new Error(
      "Ошибка при попытке выгрузки цены товарв из Битрикс"
    );
    throw error;
  }

  const fields = {
    fields: {
      STAGE_ID: "EXECUTING",
      UF_CRM_1716125097863: days,
      UF_CRM_1716123487396: storeId,
      CONTACT_ID: contactId,
      UF_CRM_1716128289935: merchantData.name,
    },
    params: { REGISTER_SONET_EVENT: "Y" },
  };
  const addDeal = await fetch(url + "crm.deal.add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fields),
  });
  if (!addDeal.ok) {
    const error = new Error("Ошибка при попытке выгрузки сделки в Битрикс");
    throw error;
  }

  const { result: newId } = await addDeal.json();
  const rows = {
    id: newId,
    rows: [{ PRODUCT_ID: productId, PRICE }],
  };
  const addProduct = await fetch(url + "crm.deal.productrows.set", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rows),
  });

  if (!addProduct.ok) {
    const error = new Error(
      "Ошибка при попытке изменить товары сделки в Битрикс"
    );
    throw error;
  }
};

const getDeal = async () => {
  try {
    const data = {
      ID: 111,
    };
    const params = new URLSearchParams(data).toString();
    const res = await fetch(url + "crm.deal.get.json?" + params, {
      method: "GET",
    });
    console.log(await res.json());
  } catch (e) {
    console.log("Ошибка при получении сделки с Битрикс:", e.message);
  }
};

// getDeal();

const getDealRows = async () => {
  try {
    const data = {
      ID: 111,
    };
    const params = new URLSearchParams(data).toString();
    const res = await fetch(url + "crm.deal.productrows.get?" + params, {
      method: "GET",
    });
    console.log(await res.json());
  } catch (e) {
    console.log("Ошибка при получении товаров сделки:", e.message);
  }
};

// getDealRows();

const getProductRowFields = async () => {
  try {
    const res = await fetch(url + "crm.productrow.fields", {
      method: "GET",
    });
    console.log(await res.json());
  } catch (e) {
    console.log("Ошибка при получении полей товаров:", e.message);
  }
};

// getProductRowFields();

const getFields = async () => {
  try {
    const res = await fetch(url + "crm.deal.fields.json", {
      method: "GET",
    });
    console.log(await res.json());
  } catch (e) {
    console.log("Ошибка при получении полей сделки:", e.message);
  }
};

// getFields();

const getContactFields = async () => {
  try {
    const res = await fetch(url + "crm.contact.fields", {
      method: "GET",
    });
    console.log(await res.json());
  } catch (e) {
    console.log("Ошибка при получении полей контактов:", e.message);
  }
};

// getContactFields();
