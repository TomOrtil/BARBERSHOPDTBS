import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  createAppointment,
  createEmployee,
  createService,
  createTransaction,
  deleteAppointment,
  deleteEmployee,
  deleteService,
  deleteTransaction,
  getAppointments,
  getEmployees,
  getServices,
  getTransactions,
  updateAppointment,
  updateEmployee,
  updateService,
  updateTransaction,
} from '@/lib/api';

type Employee = { Employee_ID: number; First_Name: string; Last_Name: string; Contact_No: string; Hire_Date: string; Salary: number; Status: string };
type Service = { Service_ID: string; Service_Name: string; Price: number };
type Appointment = { Appointment_ID: number; Service_Name: string; Customer_Name: string; Appointment_Date: string; Appointment_Time: string; Status: string };
type Transaction = { Transaction_ID: number; Customer_Name: string; Service_Name: string; Total_Amount: number; Payment_Method: string; Payment_Status: string };
type Tab = 'employees' | 'services' | 'appointments' | 'transactions';

const tabs: { key: Tab; label: string }[] = [
  { key: 'employees', label: 'Employees' },
  { key: 'services', label: 'Services' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'transactions', label: 'Transactions' },
];

const initialForm = {
  employees: { First_Name: '', Last_Name: '', Contact_No: '', Hire_Date: '', Salary: '', Status: 'Active', Password: '' },
  services: { Service_Name: '', Price: '' },
  appointments: { Service_Name: '', Customer_Name: '', Appointment_Date: '', Appointment_Time: '', Status: 'Scheduled' },
  transactions: { Customer_Name: '', Service_Name: '', Total_Amount: '', Payment_Method: 'Cash', Payment_Status: 'Paid' },
};

const initialEditing = { employees: null as number | null, services: null as string | null, appointments: null as number | null, transactions: null as number | null };

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 920;
  const [activeTab, setActiveTab] = useState<Tab>('employees');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(initialEditing);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [a, b, c, d] = await Promise.all([getEmployees(), getServices(), getAppointments(), getTransactions()]);
      setEmployees(Array.isArray(a) ? a : []);
      setServices(Array.isArray(b) ? b : []);
      setAppointments(Array.isArray(c) ? c : []);
      setTransactions(Array.isArray(d) ? d : []);
    } catch {
      setError('Unable to load dashboard data. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const updateForm = (section: keyof typeof initialForm, field: string, value: string) => {
    setForm((current) => ({
      ...current,
      [section]: { ...current[section], [field]: value },
    }));
  };

  const resetSection = (section: keyof typeof initialForm) => {
    setForm((current) => ({ ...current, [section]: initialForm[section] }));
    setEditing((current) => ({ ...current, [section]: null }));
  };

  const confirmDelete = (message: string, action: () => Promise<void>) => {
    Alert.alert('Delete record', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await action();
            await loadDashboard();
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unable to delete the record.';
            Alert.alert('Error', message);
          }
        },
      },
    ]);
  };

  const saveEmployee = async () => {
    const v = form.employees;
    if (!v.First_Name || !v.Last_Name || !v.Contact_No || !v.Hire_Date || !v.Salary || !v.Status || (!editing.employees && !v.Password)) {
      Alert.alert('Missing fields', 'Complete all employee details first.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...v, Salary: Number(v.Salary) };
      if (editing.employees) {
        await updateEmployee(editing.employees, payload);
      } else {
        await createEmployee(payload);
      }
      resetSection('employees');
      await loadDashboard();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save the employee record.';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const saveService = async () => {
    const v = form.services;
    if (!v.Service_Name || !v.Price) {
      Alert.alert('Missing fields', 'Complete the service details first.');
      return;
    }
    setSubmitting(true);
    try {
      if (editing.services) {
        await updateService(editing.services, { Service_Name: v.Service_Name, Price: Number(v.Price) });
      } else {
        await createService({ Service_Name: v.Service_Name, Price: Number(v.Price) });
      }
      resetSection('services');
      await loadDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save the service.';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const saveAppointment = async () => {
    const v = form.appointments;
    if (!v.Service_Name || !v.Customer_Name || !v.Appointment_Date || !v.Appointment_Time || !v.Status) {
      Alert.alert('Missing fields', 'Complete the appointment details first.');
      return;
    }
    setSubmitting(true);
    try {
      if (editing.appointments) {
        await updateAppointment(editing.appointments, v);
      } else {
        await createAppointment(v);
      }
      resetSection('appointments');
      await loadDashboard();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save the appointment.';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const saveTransaction = async () => {
    const v = form.transactions;
    if (!v.Customer_Name || !v.Service_Name || !v.Total_Amount || !v.Payment_Method || !v.Payment_Status) {
      Alert.alert('Missing fields', 'Complete the transaction details first.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...v, Total_Amount: Number(v.Total_Amount) };
      if (editing.transactions) {
        await updateTransaction(editing.transactions, payload);
      } else {
        await createTransaction(payload);
      }
      resetSection('transactions');
      await loadDashboard();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save the transaction.';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.shell, !isDesktop && styles.shellMobile]}>
        <View style={[styles.sidebar, !isDesktop && styles.sidebarMobile]}>
          <Text style={styles.brand}>DTBS Admin</Text>
          <Text style={styles.caption}>Full CRUD dashboard</Text>
          <View style={styles.tabList}>
            {tabs.map((tab) => (
              <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}>
                <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          <Panel title={activeTab.toUpperCase()} subtitle="Create records or edit a row from the table below.">
            {activeTab === 'employees' && (
              <>
                <Grid>
                  <Field label="First Name" value={form.employees.First_Name} onChangeText={(v) => updateForm('employees', 'First_Name', v)} />
                  <Field label="Last Name" value={form.employees.Last_Name} onChangeText={(v) => updateForm('employees', 'Last_Name', v)} />
                  <Field label="Contact No" value={form.employees.Contact_No} onChangeText={(v) => updateForm('employees', 'Contact_No', v)} />
                  <Field label="Hire Date" value={form.employees.Hire_Date} onChangeText={(v) => updateForm('employees', 'Hire_Date', v)} placeholder="YYYY-MM-DD" />
                  <Field label="Salary" value={form.employees.Salary} onChangeText={(v) => updateForm('employees', 'Salary', v)} keyboardType="numeric" />
                  <Field label="Status" value={form.employees.Status} onChangeText={(v) => updateForm('employees', 'Status', v)} />
                  <Field label={editing.employees ? 'New Password' : 'Password'} value={form.employees.Password} onChangeText={(v) => updateForm('employees', 'Password', v)} secureTextEntry />
                </Grid>
                <SubmitRow loading={submitting} editing={Boolean(editing.employees)} onSave={saveEmployee} onCancel={() => resetSection('employees')} />
              </>
            )}
            {activeTab === 'services' && (
              <>
                <Grid>
                  <Field label="Service Name" value={form.services.Service_Name} onChangeText={(v) => updateForm('services', 'Service_Name', v)} />
                  <Field label="Price" value={form.services.Price} onChangeText={(v) => updateForm('services', 'Price', v)} keyboardType="numeric" />
                </Grid>
                <SubmitRow loading={submitting} editing={Boolean(editing.services)} onSave={saveService} onCancel={() => resetSection('services')} />
              </>
            )}
            {activeTab === 'appointments' && (
              <>
                <Grid>
                  <Field label="Service Name" value={form.appointments.Service_Name} onChangeText={(v) => updateForm('appointments', 'Service_Name', v)} />
                  <Field label="Customer Name" value={form.appointments.Customer_Name} onChangeText={(v) => updateForm('appointments', 'Customer_Name', v)} />
                  <Field label="Date" value={form.appointments.Appointment_Date} onChangeText={(v) => updateForm('appointments', 'Appointment_Date', v)} placeholder="YYYY-MM-DD" />
                  <Field label="Time" value={form.appointments.Appointment_Time} onChangeText={(v) => updateForm('appointments', 'Appointment_Time', v)} placeholder="10:00:00" />
                  <Field label="Status" value={form.appointments.Status} onChangeText={(v) => updateForm('appointments', 'Status', v)} />
                </Grid>
                <SubmitRow loading={submitting} editing={Boolean(editing.appointments)} onSave={saveAppointment} onCancel={() => resetSection('appointments')} />
              </>
            )}
            {activeTab === 'transactions' && (
              <>
                <Grid>
                  <Field label="Customer Name" value={form.transactions.Customer_Name} onChangeText={(v) => updateForm('transactions', 'Customer_Name', v)} />
                  <Field label="Service Name" value={form.transactions.Service_Name} onChangeText={(v) => updateForm('transactions', 'Service_Name', v)} />
                  <Field label="Total Amount" value={form.transactions.Total_Amount} onChangeText={(v) => updateForm('transactions', 'Total_Amount', v)} keyboardType="numeric" />
                  <Field label="Payment Method" value={form.transactions.Payment_Method} onChangeText={(v) => updateForm('transactions', 'Payment_Method', v)} />
                  <Field label="Payment Status" value={form.transactions.Payment_Status} onChangeText={(v) => updateForm('transactions', 'Payment_Status', v)} />
                </Grid>
                <SubmitRow loading={submitting} editing={Boolean(editing.transactions)} onSave={saveTransaction} onCancel={() => resetSection('transactions')} />
              </>
            )}
          </Panel>

          {loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator size="large" color="#e94560" />
            </View>
          ) : error ? (
            <View style={styles.stateCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {!loading && !error && activeTab === 'employees' && (
            <Table
              title="Employees"
              headers={['Employee_ID', 'First_Name', 'Last_Name', 'Contact_No', 'Hire_Date', 'Salary', 'Status']}
              rows={employees.map((row) => [
                String(row.Employee_ID),
                row.First_Name,
                row.Last_Name,
                row.Contact_No,
                row.Hire_Date,
                Number(row.Salary).toFixed(2),
                row.Status,
              ])}
              onEdit={(index) => {
                const row = employees[index];
                setEditing((c) => ({ ...c, employees: row.Employee_ID }));
                setForm((c) => ({ ...c, employees: { First_Name: row.First_Name, Last_Name: row.Last_Name, Contact_No: row.Contact_No, Hire_Date: row.Hire_Date, Salary: String(row.Salary), Status: row.Status, Password: '' } }));
              }}
              onDelete={(index) => {
                const row = employees[index];
                confirmDelete(`Delete ${row.First_Name} ${row.Last_Name}?`, async () => {
                  await deleteEmployee(row.Employee_ID);
                  if (editing.employees === row.Employee_ID) resetSection('employees');
                });
              }}
            />
          )}

          {!loading && !error && activeTab === 'services' && (
            <Table
              title="Services"
              headers={['Service_ID', 'Service_Name', 'Price']}
              rows={services.map((row) => [row.Service_ID, row.Service_Name, Number(row.Price).toFixed(2)])}
              onEdit={(index) => {
                const row = services[index];
                setEditing((c) => ({ ...c, services: row.Service_ID }));
                setForm((c) => ({ ...c, services: { Service_Name: row.Service_Name, Price: String(row.Price) } }));
              }}
              onDelete={(index) => {
                const row = services[index];
                confirmDelete(`Delete ${row.Service_Name}?`, async () => {
                  await deleteService(row.Service_ID);
                  if (editing.services === row.Service_ID) resetSection('services');
                });
              }}
            />
          )}

          {!loading && !error && activeTab === 'appointments' && (
            <Table
              title="Appointments"
              headers={['Appointment_ID', 'Service_Name', 'Customer_Name', 'Appointment_Date', 'Appointment_Time', 'Status']}
              rows={appointments.map((row) => [String(row.Appointment_ID), row.Service_Name, row.Customer_Name, row.Appointment_Date, row.Appointment_Time, row.Status])}
              onEdit={(index) => {
                const row = appointments[index];
                setEditing((c) => ({ ...c, appointments: row.Appointment_ID }));
                setForm((c) => ({ ...c, appointments: { Service_Name: row.Service_Name, Customer_Name: row.Customer_Name, Appointment_Date: row.Appointment_Date, Appointment_Time: row.Appointment_Time, Status: row.Status } }));
              }}
              onDelete={(index) => {
                const row = appointments[index];
                confirmDelete(`Delete appointment for ${row.Customer_Name}?`, async () => {
                  await deleteAppointment(row.Appointment_ID);
                  if (editing.appointments === row.Appointment_ID) resetSection('appointments');
                });
              }}
            />
          )}

          {!loading && !error && activeTab === 'transactions' && (
            <Table
              title="Transactions"
              headers={['Transaction_ID', 'Customer_Name', 'Service_Name', 'Total_Amount', 'Payment_Method', 'Payment_Status']}
              rows={transactions.map((row) => [String(row.Transaction_ID), row.Customer_Name, row.Service_Name, Number(row.Total_Amount).toFixed(2), row.Payment_Method, row.Payment_Status])}
              onEdit={(index) => {
                const row = transactions[index];
                setEditing((c) => ({ ...c, transactions: row.Transaction_ID }));
                setForm((c) => ({ ...c, transactions: { Customer_Name: row.Customer_Name, Service_Name: row.Service_Name, Total_Amount: String(row.Total_Amount), Payment_Method: row.Payment_Method, Payment_Status: row.Payment_Status } }));
              }}
              onDelete={(index) => {
                const row = transactions[index];
                confirmDelete(`Delete transaction for ${row.Customer_Name}?`, async () => {
                  await deleteTransaction(row.Transaction_ID);
                  if (editing.transactions === row.Transaction_ID) resetSection('transactions');
                });
              }}
            />
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      <Text style={styles.panelSubtitle}>{subtitle}</Text>
      {children}
    </View>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

function Field({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: 'default' | 'numeric' | 'phone-pad'; secureTextEntry?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8a8f98" keyboardType={keyboardType} secureTextEntry={secureTextEntry} />
    </View>
  );
}

function SubmitRow({ loading, editing, onSave, onCancel }: { loading: boolean; editing: boolean; onSave: () => void; onCancel: () => void }) {
  return (
    <View style={styles.submitRow}>
      {editing && (
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      )}
      <Pressable style={styles.saveButton} onPress={onSave} disabled={loading}>
        <Text style={styles.saveText}>{loading ? 'Saving...' : editing ? 'Update Record' : 'Save Record'}</Text>
      </Pressable>
    </View>
  );
}

function Table({ title, headers, rows, onEdit, onDelete }: { title: string; headers: string[]; rows: string[][]; onEdit: (index: number) => void; onDelete: (index: number) => void }) {
  return (
    <Panel title={title} subtitle="Edit or delete any row.">
      {rows.length === 0 ? (
        <Text style={styles.emptyText}>No records found.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.tableHeader}>
              {headers.map((h) => (
                <View key={h} style={styles.tableHeaderCell}>
                  <Text style={styles.tableHeaderText}>{h}</Text>
                </View>
              ))}
              <View style={styles.tableHeaderCell}>
                <Text style={styles.tableHeaderText}>Actions</Text>
              </View>
            </View>
            {rows.map((row, index) => (
              <View key={`${title}-${index}`} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
                {row.map((cell, i) => (
                  <View key={`${index}-${i}`} style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{cell}</Text>
                  </View>
                ))}
                <View style={styles.tableCell}>
                  <View style={styles.rowActions}>
                    <Pressable style={styles.editBtn} onPress={() => onEdit(index)}>
                      <Text style={styles.editBtnText}>Edit</Text>
                    </Pressable>
                    <Pressable style={styles.deleteBtn} onPress={() => onDelete(index)}>
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </Panel>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f3ede5' },
  shell: { flex: 1, flexDirection: 'row' },
  shellMobile: { flexDirection: 'column' },
  sidebar: { width: 260, backgroundColor: '#1f2937', paddingHorizontal: 24, paddingVertical: 32 },
  sidebarMobile: { width: '100%' },
  brand: { color: '#f8fafc', fontSize: 28, fontWeight: '800' },
  caption: { color: '#b6c2d2', marginTop: 8, marginBottom: 24 },
  tabList: { gap: 10 },
  tabButton: { backgroundColor: '#283548', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 },
  tabButtonActive: { backgroundColor: '#f97316' },
  tabLabel: { color: '#f8fafc', fontWeight: '700' },
  tabLabelActive: { color: '#1c1917' },
  content: { flex: 1 },
  contentInner: { padding: 24, gap: 20 },
  panel: { backgroundColor: '#fffaf4', borderRadius: 24, borderWidth: 1, borderColor: '#eadfcf', padding: 20 },
  panelTitle: { color: '#111827', fontSize: 24, fontWeight: '800' },
  panelSubtitle: { color: '#6b7280', marginTop: 6, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  field: { minWidth: 220, flexGrow: 1, flexBasis: 220 },
  fieldLabel: { color: '#374151', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddcfbf', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: '#111827' },
  submitRow: { marginTop: 18, flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  saveButton: { backgroundColor: '#f97316', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14 },
  saveText: { color: '#1c1917', fontWeight: '800' },
  cancelButton: { backgroundColor: '#dbe3ec', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14 },
  cancelText: { color: '#243445', fontWeight: '700' },
  stateCard: { minHeight: 180, backgroundColor: '#fffaf4', borderRadius: 24, borderWidth: 1, borderColor: '#eadfcf', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#9a3412' },
  emptyText: { color: '#6b7280' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#2b3340' },
  tableHeaderCell: { minWidth: 140, paddingHorizontal: 14, paddingVertical: 12, borderRightWidth: 1, borderRightColor: '#455264' },
  tableHeaderText: { color: '#f9fafb', fontSize: 12, fontWeight: '700' },
  tableRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e8ddd0' },
  tableRowAlt: { backgroundColor: '#fcf7f1' },
  tableCell: { minWidth: 140, paddingHorizontal: 14, paddingVertical: 14, borderRightWidth: 1, borderRightColor: '#ece4d9' },
  tableCellText: { color: '#1f2937', fontSize: 13 },
  rowActions: { flexDirection: 'row', gap: 8 },
  editBtn: { backgroundColor: '#dbeafe', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  editBtnText: { color: '#1d4ed8', fontSize: 12, fontWeight: '700' },
  deleteBtn: { backgroundColor: '#fee2e2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  deleteBtnText: { color: '#b91c1c', fontSize: 12, fontWeight: '700' },
});
