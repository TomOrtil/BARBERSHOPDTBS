const express = require('express');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
app.use(express.json());
app.use(require('cors')());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

db.connect((err) => {
  if (err) throw err;
  console.log('MySQL connected!');
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

function handleDbError(res, err, fallbackMessage) {
  console.error(fallbackMessage, err);
  res.status(500).json({
    message: fallbackMessage,
    error: err.message,
  });
}

function getNextServiceId() {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT Service_ID FROM services ORDER BY CAST(SUBSTRING(Service_ID, 2) AS UNSIGNED) DESC LIMIT 1",
      (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        const lastId = results[0]?.Service_ID ?? 'S000';
        const lastNumber = Number.parseInt(String(lastId).replace(/^\D+/g, ''), 10) || 0;
        const nextId = `S${String(lastNumber + 1).padStart(3, '0')}`;
        resolve(nextId);
      }
    );
  });
}
// ========== LOGIN ==========
app.post('/login', (req, res) => {
  const { Contact_No, Password } = req.body;

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (
    adminUsername &&
    adminPassword &&
    Contact_No === adminUsername &&
    Password === adminPassword
  ) {
    return res.json({
      message: 'Login successful',
      employee: {
        Employee_ID: 0,
        First_Name: 'Admin',
        Last_Name: 'User',
        Contact_No: adminUsername,
        Role: 'admin',
      },
    });
  }

  db.query(
    'SELECT * FROM employees WHERE Contact_No = ? AND Password = ?',
    [Contact_No, Password],
    (err, results) => {
      if (err) {
        return handleDbError(res, err, 'Unable to process login');
      }
      if (results.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      res.json({ message: 'Login successful', employee: results[0] });
    }
  );
});
// ========== EMPLOYEES ==========
app.get('/employees', (req, res) => {
  db.query('SELECT * FROM employees', (err, results) => {
    if (err) {
      return handleDbError(res, err, 'Unable to load employees');
    }
    res.json(results);
  });
});

app.post('/employees', (req, res) => {
  const { First_Name, Last_Name, Contact_No, Hire_Date, Salary, Status, Password } = req.body;
  const hasPassword = typeof Password === 'string' && Password.length > 0;
  const query = hasPassword
    ? 'INSERT INTO employees (First_Name, Last_Name, Contact_No, Hire_Date, Salary, Status, Password) VALUES (?, ?, ?, ?, ?, ?, ?)'
    : 'INSERT INTO employees (First_Name, Last_Name, Contact_No, Hire_Date, Salary, Status) VALUES (?, ?, ?, ?, ?, ?)';
  const params = hasPassword
    ? [First_Name, Last_Name, Contact_No, Hire_Date, Salary, Status, Password]
    : [First_Name, Last_Name, Contact_No, Hire_Date, Salary, Status];

  db.query(query, params, (err, result) => {
    if (err) {
      return handleDbError(res, err, 'Unable to create employee');
    }
    res.status(201).json({ id: result.insertId, ...req.body });
  });
});

app.put('/employees/:id', (req, res) => {
  const { First_Name, Last_Name, Contact_No, Hire_Date, Salary, Status, Password } = req.body;
  const hasPassword = typeof Password === 'string' && Password.length > 0;
  const query = hasPassword
    ? 'UPDATE employees SET First_Name = ?, Last_Name = ?, Contact_No = ?, Hire_Date = ?, Salary = ?, Status = ?, Password = ? WHERE Employee_ID = ?'
    : 'UPDATE employees SET First_Name = ?, Last_Name = ?, Contact_No = ?, Hire_Date = ?, Salary = ?, Status = ? WHERE Employee_ID = ?';
  const params = hasPassword
    ? [First_Name, Last_Name, Contact_No, Hire_Date, Salary, Status, Password, req.params.id]
    : [First_Name, Last_Name, Contact_No, Hire_Date, Salary, Status, req.params.id];

  db.query(query, params, (err) => {
    if (err) {
      return handleDbError(res, err, 'Unable to update employee');
    }
    res.json({ message: 'Employee updated' });
  });
});

app.delete('/employees/:id', (req, res) => {
  db.query('DELETE FROM employees WHERE Employee_ID = ?', [req.params.id], (err, result) => {
    if (err) {
      return handleDbError(res, err, 'Unable to delete employee');
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted' });
  });
});

// ========== SERVICES ==========
app.get('/services', (req, res) => {
  db.query('SELECT * FROM services', (err, results) => {
    if (err) {
      return handleDbError(res, err, 'Unable to load services');
    }
    res.json(results);
  });
});

app.post('/services', async (req, res) => {
  const { Service_ID, Service_Name, Price } = req.body;

  try {
    const generatedServiceId = Service_ID || (await getNextServiceId());

    db.query(
      'INSERT INTO services (Service_ID, Service_Name, Price) VALUES (?, ?, ?)',
      [generatedServiceId, Service_Name, Price],
      (err) => {
        if (err) {
          return handleDbError(res, err, 'Unable to create service');
        }
        res.status(201).json({
          Service_ID: generatedServiceId,
          Service_Name,
          Price,
        });
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Unable to generate service ID', error: err.message });
  }
});

app.put('/services/:id', (req, res) => {
  const { Service_Name, Price } = req.body;
  db.query(
    'UPDATE services SET Service_Name = ?, Price = ? WHERE Service_ID = ?',
    [Service_Name, Price, req.params.id],
    (err) => {
      if (err) {
        return handleDbError(res, err, 'Unable to update service');
      }
      res.json({ message: 'Service updated' });
    }
  );
});

app.delete('/services/:id', (req, res) => {
  db.query('DELETE FROM services WHERE Service_ID = ?', [req.params.id], (err, result) => {
    if (err) {
      return handleDbError(res, err, 'Unable to delete service');
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json({ message: 'Service deleted' });
  });
});

// ========== APPOINTMENTS ==========
app.get('/appointments', (req, res) => {
  db.query('SELECT * FROM appointments', (err, results) => {
    if (err) {
      return handleDbError(res, err, 'Unable to load appointments');
    }
    res.json(results);
  });
});

app.post('/appointments', (req, res) => {
  const { Service_Name, Customer_Name, Appointment_Date, Appointment_Time, Status } = req.body;
  db.query(
    'INSERT INTO appointments (Service_Name, Customer_Name, Appointment_Date, Appointment_Time, Status) VALUES (?, ?, ?, ?, ?)',
    [Service_Name, Customer_Name, Appointment_Date, Appointment_Time, Status],
    (err, result) => {
      if (err) {
        return handleDbError(res, err, 'Unable to create appointment');
      }
      res.status(201).json({ id: result.insertId, ...req.body });
    }
  );
});

app.put('/appointments/:id', (req, res) => {
  const { Service_Name, Customer_Name, Appointment_Date, Appointment_Time, Status } = req.body;
  db.query(
    'UPDATE appointments SET Service_Name = ?, Customer_Name = ?, Appointment_Date = ?, Appointment_Time = ?, Status = ? WHERE Appointment_ID = ?',
    [Service_Name, Customer_Name, Appointment_Date, Appointment_Time, Status, req.params.id],
    (err) => {
      if (err) {
        return handleDbError(res, err, 'Unable to update appointment');
      }
      res.json({ message: 'Appointment updated' });
    }
  );
});

app.delete('/appointments/:id', (req, res) => {
  db.query('DELETE FROM appointments WHERE Appointment_ID = ?', [req.params.id], (err, result) => {
    if (err) {
      return handleDbError(res, err, 'Unable to delete appointment');
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json({ message: 'Appointment deleted' });
  });
});

// ========== TRANSACTIONS ==========
app.get('/transactions', (req, res) => {
  db.query('SELECT * FROM transactions', (err, results) => {
    if (err) {
      return handleDbError(res, err, 'Unable to load transactions');
    }
    res.json(results);
  });
});

app.post('/transactions', (req, res) => {
  const { Customer_Name, Service_Name, Total_Amount, Payment_Method, Payment_Status } = req.body;
  db.query(
    'INSERT INTO transactions (Customer_Name, Service_Name, Total_Amount, Payment_Method, Payment_Status) VALUES (?, ?, ?, ?, ?)',
    [Customer_Name, Service_Name, Total_Amount, Payment_Method, Payment_Status],
    (err, result) => {
      if (err) {
        return handleDbError(res, err, 'Unable to create transaction');
      }
      res.status(201).json({ id: result.insertId, ...req.body });
    }
  );
});

app.put('/transactions/:id', (req, res) => {
  const { Customer_Name, Service_Name, Total_Amount, Payment_Method, Payment_Status } = req.body;
  db.query(
    'UPDATE transactions SET Customer_Name = ?, Service_Name = ?, Total_Amount = ?, Payment_Method = ?, Payment_Status = ? WHERE Transaction_ID = ?',
    [Customer_Name, Service_Name, Total_Amount, Payment_Method, Payment_Status, req.params.id],
    (err) => {
      if (err) {
        return handleDbError(res, err, 'Unable to update transaction');
      }
      res.json({ message: 'Transaction updated' });
    }
  );
});

app.delete('/transactions/:id', (req, res) => {
  db.query('DELETE FROM transactions WHERE Transaction_ID = ?', [req.params.id], (err, result) => {
    if (err) {
      return handleDbError(res, err, 'Unable to delete transaction');
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted' });
  });
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
