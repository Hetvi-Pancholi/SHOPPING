const port = process.env.PORT || 4000;
const express = require("express");
const app = express(); //app instance
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken"); //they are compact URL-safe tokens used for securely transmitting info between parties as a JSON object. they are commonly used for authentication and information exchange
const multer = require("multer"); //it is middleware that store images in backend folder that we will upload using admin pannel, primarily used for uploading files
const path = require("path"); //using this we can get access to our backend directory in our express app
const cors = require("cors"); //(CORS- Cross Origin Resource Sharing- used to integrate application)using this we can add the permission to our application to access the backend
const { type } = require("os");
const { error } = require("console");

app.use(express.json()); //using this whatever request we will get from response that will be automatically passed through json
app.use(cors()); //using this our reactjs project will connect to express app on 4000 port

//database connection with mongodb
mongoose.connect(
  "mongodb+srv://hetvipancholi:hetvi2714@cluster0.mqihr.mongodb.net/e-commerce"
);

//API creation - just for checking
app.get("/", (req, res) => {
  res.send("Express App is running");
});

//image storage engine
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage: storage });

//creating upload endpoint for images
app.use("/images", express.static("upload/images"));

app.post("/upload", upload.single("product"), (req, res) => {
  res.json({
    success: 1,
    image_url: `http://localhost:${port}/images/${req.file.filename}`,
  });
});

//schema for creating products
const Product = mongoose.model("Product", {
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: true,
  },
  old_price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  available: {
    type: Boolean,
    default: true,
  },
});

//creating api for adding product
app.post("/addproduct", async (req, res) => {
  let products = await Product.find({});
  let id;
  if (products.length > 0) {
    let last_product_array = products.slice(-1);
    let last_product = last_product_array[0];
    id = last_product.id + 1;
  } else {
    id = 1;
  }
  const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });
  console.log(product);
  await product.save(); //here async-await use because whenever we save anything into databaase it will take some time
  console.log("Saved");
  res.json({
    //response for the frontend
    success: true,
    name: req.body.name,
  });
});

//creating api for deleting products
app.post("/removeproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("Removed");
  res.json({
    success: true,
    name: req.body.name,
  });
});

//creating api for getting all products
app.get("/allproducts", async (req, res) => {
  let products = await Product.find({});
  console.log("All Products Fetched");
  res.send(products);
});

//Schema creating for user model
const Users = mongoose.model("Users", {
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  cartData: {
    type: Object,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

//creating endpoinnt for registering the user
app.post("/signup", async (req, res) => {
  let check = await Users.findOne({ email: req.body.email }); //if any account is already register with this email id then we will get that data inn this check variable
  if (check) {
    return res.status(400).json({
      success: false,
      errors: "existing user found with same email address",
    }); //beacuse we have not created any account as account is already register and it will show error that existing user found
  }
  let cart = {}; //if there is no error then
  //using this for loop it will create empty object where we get the keys from 1 to 300
  for (let i = 0; i < 300; i++) {
    cart[i] = 0;
  }
  const user = new Users({
    //using this we will create user
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  });
  await user.save(); //using this we will save the user data in database

  //now we will do jwt authentication
  const data = {
    //for jwt authentication first create one data object
    user: {
      //key
      id: user.id,
    },
  };
  const token = jwt.sign(data, "secret_ecom"); //creating token in this we will pass the data object which we created above and 2nd argument pass as salt when we use this salt our data will be encrypted by one layer so in this one we will add secret_ecom using this secret_ecom our token will not be readable
  res.json({
    //after creating token we will generate response with success true and the token
    success: true,
    token,
  });
});

//creating api endpoint for login user
app.post("/login", async (req, res) => {
  let user = await Users.findOne({ email: req.body.email });
  if (user) {
    const passCompare = req.body.password === user.password;
    if (passCompare) {
      const data = {
        user: {
          id: user.id,
        },
      };
      const token = jwt.sign(data, "secret_ecom");
      res.json({ success: true, token });
    } else {
      res.json({ success: false, errors: "Wrong Password" });
    }
  } else {
    res.json({ success: false, errors: "Wrong Email Id" });
  }
});

//creating api endpoint for new collection data
app.get("/newcollections", async (req, res) => {
  let products = await Product.find({}); //here all the products will save in the products array
  let newcollection = products.slice(1).slice(-8); //using this we will get recently added 8 products from products array
  console.log("NewCollection Fetched");
  res.send(newcollection);
});

//creating api endpoint for popular in women category
app.get("/popularinwomen", async (req, res) => {
  let products = await Product.find({ category: "women" }); //all the products of the women category will bw added to this products
  let popular_in_women = products.slice(0, 4);
  console.log("Popular In Women Fetched");
  res.send(popular_in_women);
});

//creating middleware to fetch user
const fetchUser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    res.status(401).send({ erroes: "Please authenticate using valid token" });
  } else {
    try {
      const data = jwt.verify(token, "secret_ecom");
      req.user = data.user;
      next();
    } catch (error) {
      res.status(401).send({ errors: "Please authenticate using valid token" });
    }
  }
};

//creating api endpoint for adding products in cartData
app.post("/addtocart", fetchUser, async (req, res) => {
  console.log("Added", req.body.itemId);
  let userData = await Users.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] += 1;
  await Users.findOneAndUpdate(
    { _id: req.user.id },
    { cartData: userData.cartData }
  );
  res.send("Added");
});

//creating api endpoint ffor removing products from cartData
app.post("/removefromcart", fetchUser, async (req, res) => {
  console.log("Removed", req.body.itemId);
  let userData = await Users.findOne({ _id: req.user.id });
  if (userData.cartData[req.body.itemId] > 0)
    userData.cartData[req.body.itemId] -= 1;
  await Users.findOneAndUpdate(
    { _id: req.user.id },
    { cartData: userData.cartData }
  );
  res.send("Removed");
});

//creating api endpoint for get cartData after re login-here using fetchuser we will find the userid from token
app.post("/getcart", fetchUser, async (req, res) => {
  console.log("GetCart");
  let userData = await Users.findOne({ _id: req.user.id });
  res.json(userData.cartData);
});

app.listen(port, (error) => {
  if (!error) {
    console.log("Server is running on port " + port);
  } else {
    console.log("Error : " + error);
  }
});
