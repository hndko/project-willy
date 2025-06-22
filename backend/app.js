// Entry Point
const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");

// Router
const authRouter = require("./routes/authRouter");
const roleRoutes = require("./routes/roleRoutes");
const userRouter = require("./routes/userRouter");
const categoryRouter = require("./routes/categoryRouter");
const supplierRouter = require("./routes/supplierRouter");
const productRouter = require("./routes/productRouter");
const stockRouter = require("./routes/stockRouter");
const rawMaterialRouter = require("./routes/rawMaterialRouter");
const activityLogRouter = require("./routes/activityLogRouter");
const purchaseRouter = require("./routes/purchaseRouter");
const saleRouter = require("./routes/saleRouter");
const usageRouter = require("./routes/usageRouter");
const operationalCostRouter = require("./routes/operationalCostRouter");
const customerRouter = require("./routes/customerRouter");
const invoiceRouter = require("./routes/invoiceRouter");
const profileRouter = require("./routes/profileRoutes");
const deliveryRouter = require("./routes/deliveryRouter");
const bomRouter = require("./routes/bomRouter");
const productionRouter = require("./routes/productionRouter");
const stockReportRoutes = require("./routes/stockReportRoutes");

const morgan = require("morgan"); // Untuk mengecek endpoint apa saja yang berjalan pada terminal
const cookieParse = require("cookie-parser"); // membaca cookie jwt
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");

dotenv.config(); //Untuk menjalankan config pada dotenv.

//Middleware
app.use(express.json()); //Build in middleware
app.use(express.urlencoded({ extended: true })); // urlencoded untuk di postman.
app.use(cookieParse()); //Cookie Parse
app.use(morgan("dev")); // Untuk mengecek endpoint yang berjalan di terminal pada postman.
app.use(
  cors({
    origin: [
      "http://localhost:8000",
      "http://localhost:3000",
      "http://127.0.0.1:8000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
const path = require("path");

// Static files middleware
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/invoices", express.static(path.join(__dirname, "public/invoices")));

// Routing API
app.get("/api", (req, res) => {
  res.json({ message: "Welcome to the API" });
});
app.use("/api/v1/auth", authRouter); // Auth Routing
app.use("/api/v1/roles", roleRoutes); // Role Routing
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter); // Category Routing
app.use("/api/v1/suppliers", supplierRouter); // Supplier Routing
app.use("/api/v1/products", productRouter); // Product Routing
app.use("/api/v1/stocks", stockRouter); // Stock Routing
app.use("/api/v1/raw-materials", rawMaterialRouter); // Material Routing
app.use("/api/v1/activity-logs", activityLogRouter); // Activity Log Routing
app.use("/api/v1/purchases", purchaseRouter); // Purchase Routing
app.use("/api/v1/sales", saleRouter); // Sale Routing
app.use("/api/v1/usages", usageRouter); // Usage Routing
app.use("/api/v1/operationals-cost", operationalCostRouter); // OP Cost Routing
app.use("/api/v1/customers", customerRouter); // Customer Routing
app.use("/api/v1/invoices", invoiceRouter); // PDF Generate Routing
app.use("/api/v1/profile", profileRouter); // Profile Routing
app.use("/api/v1/deliveries", deliveryRouter); // Delivery Routing
app.use("/api/v1/boms", bomRouter);
app.use("/api/v1/productions", productionRouter);
app.use("/api/v1/stock-reports", stockReportRoutes);

app.use(notFound); // Global Hendler
app.use(errorHandler); // ErrorHandler Middleware

// Untuk Server
const port = process.env.PORT; // kita setting ke file env.PORT karena disana ada PORT3000
app.listen(port, () => {
  console.log(`Server berjalan di port: ${port}`);
});
