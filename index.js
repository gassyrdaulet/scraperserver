import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import OfferRoutes from "./routes/OfferRoutes.js";
import StoreRoutes from "./routes/StoreRoutes.js";
import OtherRoutes from "./routes/OtherRoutes.js";
import config from "./config.json" assert { type: "json" };

const { PORT } = config;
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use("/api/offers/", OfferRoutes);
app.use("/api/stores/", StoreRoutes);
app.use("/api/other/", OtherRoutes);

app.listen(PORT, () => {
  console.log("Server is live on port:", PORT);
});
