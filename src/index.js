const { response } = require("express");
const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

var customers = [];

const verifyIfAccountExist = (req, res, next) => {
  const { cpf } = req.headers;
  const customer = customers.find((cust) => cust.cpf === cpf);
  if (!customer) return res.status(400).json({ error: "Customer not found" });
  req.customer = customer;
  return next();
};

const getBalance = (statement) => {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);
  console.log("saldo e:", balance);
  return balance;
};

app.post("/account", (req, res) => {
  const { cpf, name } = req.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return res.status(400).json({ error: "Customer already exists!" });
  }

  customers.push({ cpf, name, id: uuidv4(), statement: [] });
  return res.status(201).send(customers);
});

app.get("/statement/", verifyIfAccountExist, (req, res) => {
  try {
    return res.json(req.customer.statement);
  } catch (error) {
    return res.json({ error: "Erro ao pegar dados" });
  }
});

app.post("/deposit", verifyIfAccountExist, (req, res) => {
  const { description, amount } = req.body;
  const { customer } = req;

  const statementOperation = {
    description,
    amount,
    createdAt: new Date(),
    type: "credit",
  };
  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.post("/withdraw", verifyIfAccountExist, (req, res) => {
  const { amount } = req.body;
  const { customer } = req;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return res.status(400).json({ error: "Insuficcient funds!" });
  }

  const statementOperation = {
    amount,
    createdAt: new Date(),
    type: "debit",
  };
  customer.statement.push(statementOperation);

  return res.sendStatus(201).send(balance);
});

app.get("/statement/date", verifyIfAccountExist, (req, res) => {
  const { customer } = req;
  const { date } = req.query;

  //hack to have the right date, no mater the time requested
  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    (state) =>
      state.createdAt.toDateString() === new Date(dateFormat).toDateString()
  );
  return res.json(statement);
});

app.put("/account", verifyIfAccountExist, (req, res) => {
  const { name } = req.body;
  const { customer } = req;
  const oldName = customer.name;
  customer.name = name;
  res
    .status(201)
    .send(`${oldName} foi alterado para ${customer.name} com sucesso`);
});

app.get("/account", verifyIfAccountExist, (req, res) => {
  const { customer } = req;

  return res.json(customer);
});

app.delete("/account", verifyIfAccountExist, (req, res) => {
  const { customer } = req;

  customers.splice(customer, 1);

  res.status(200).send(customers);
});

app.get("/balance", verifyIfAccountExist, (req, res) => {
  const { customer } = req;
  const balance = getBalance(customer.statement);

  return res.json(balance);
});

app.listen(3333, () => {
  console.log("APP is listening on port 3333");
});
