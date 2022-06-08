const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const customers = [];

const verifyIfAccountExist = (req, res, next) => {
  const { cpf } = req.headers;
  const customer = customers.find((cust) => cust.cpf === cpf);
  if (!customer) return res.status(400).json({ error: "Customer not found" });
  req.customer = customer;
  return next();
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

app.listen(3333, () => {
  console.log("APP is listening on port 3333");
});
