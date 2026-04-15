const BASE_URL = 'http://192.168.1.13:5001'; // your local IP and backend port

async function parseJsonResponse(res: Response) {
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data;
}

// ========== EMPLOYEES ==========
export const getEmployees = async () => {
  const res = await fetch(`${BASE_URL}/employees`);
  return parseJsonResponse(res);
};

export const createEmployee = async (employee: {
  First_Name: string;
  Last_Name: string;
  Contact_No: string;
  Hire_Date: string;
  Salary: number;
  Status: string;
  Password?: string;
}) => {
  const res = await fetch(`${BASE_URL}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee),
  });
  return parseJsonResponse(res);
};

export const updateEmployee = async (
  id: number,
  employee: {
    First_Name: string;
    Last_Name: string;
    Contact_No: string;
    Hire_Date: string;
    Salary: number;
    Status: string;
    Password?: string;
  }
) => {
  const res = await fetch(`${BASE_URL}/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee),
  });
  return parseJsonResponse(res);
};

export const deleteEmployee = async (id: number) => {
  const res = await fetch(`${BASE_URL}/employees/${id}`, {
    method: 'DELETE',
  });
  return parseJsonResponse(res);
};
// ========== LOGIN ==========
export const loginEmployee = async (Contact_No: string, Password: string) => {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Contact_No, Password }),
  });
  return parseJsonResponse(res);
};
// ========== SERVICES ==========
export const getServices = async () => {
  const res = await fetch(`${BASE_URL}/services`);
  return parseJsonResponse(res);
};

export const createService = async (service: {
  Service_ID?: string;
  Service_Name: string;
  Price: number;
}) => {
  const res = await fetch(`${BASE_URL}/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(service),
  });
  return parseJsonResponse(res);
};

export const updateService = async (
  id: string,
  service: {
    Service_Name: string;
    Price: number;
  }
) => {
  const res = await fetch(`${BASE_URL}/services/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(service),
  });
  return parseJsonResponse(res);
};

export const deleteService = async (id: string) => {
  const res = await fetch(`${BASE_URL}/services/${id}`, {
    method: 'DELETE',
  });
  return parseJsonResponse(res);
};

// ========== APPOINTMENTS ==========
export const getAppointments = async () => {
  const res = await fetch(`${BASE_URL}/appointments`);
  return parseJsonResponse(res);
};

export const createAppointment = async (appointment: {
  Service_Name: string;
  Customer_Name: string;
  Appointment_Date: string;
  Appointment_Time: string;
  Status: string;
}) => {
  const res = await fetch(`${BASE_URL}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appointment),
  });
  return parseJsonResponse(res);
};

export const updateAppointment = async (
  id: number,
  appointment: {
    Service_Name: string;
    Customer_Name: string;
    Appointment_Date: string;
    Appointment_Time: string;
    Status: string;
  }
) => {
  const res = await fetch(`${BASE_URL}/appointments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appointment),
  });
  return parseJsonResponse(res);
};

export const deleteAppointment = async (id: number) => {
  const res = await fetch(`${BASE_URL}/appointments/${id}`, {
    method: 'DELETE',
  });
  return parseJsonResponse(res);
};

// ========== TRANSACTIONS ==========
export const getTransactions = async () => {
  const res = await fetch(`${BASE_URL}/transactions`);
  return parseJsonResponse(res);
};

export const createTransaction = async (transaction: {
  Customer_Name: string;
  Service_Name: string;
  Total_Amount: number;
  Payment_Method: string;
  Payment_Status: string;
}) => {
  const res = await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });
  return parseJsonResponse(res);
};

export const updateTransaction = async (
  id: number,
  transaction: {
    Customer_Name: string;
    Service_Name: string;
    Total_Amount: number;
    Payment_Method: string;
    Payment_Status: string;
  }
) => {
  const res = await fetch(`${BASE_URL}/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });
  return parseJsonResponse(res);
};

export const deleteTransaction = async (id: number) => {
  const res = await fetch(`${BASE_URL}/transactions/${id}`, {
    method: 'DELETE',
  });
  return parseJsonResponse(res);
};
