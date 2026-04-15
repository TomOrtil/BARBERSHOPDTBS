import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { createAppointment, createEmployee, createService, createTransaction, deleteAppointment, deleteEmployee, deleteService, deleteTransaction, getAppointments, getEmployees, getServices, getTransactions, updateAppointment, updateEmployee, updateService, updateTransaction } from '@/lib/api';

type Employee = { Employee_ID: number; First_Name: string; Last_Name: string; Contact_No: string; Hire_Date: string; Salary: number; Status: string };
type Service = { Service_ID: string; Service_Name: string; Price: number };
type Appointment = { Appointment_ID: number; Service_Name: string; Customer_Name: string; Appointment_Date: string; Appointment_Time: string; Status: string };
type Transaction = { Transaction_ID: number; Customer_Name: string; Service_Name: string; Total_Amount: number; Payment_Method: string; Payment_Status: string };
type Tab = 'home' | 'employees' | 'services' | 'appointments' | 'transactions';

const tabs: { key: Tab; label: string }[] = [
  { key: 'home', label: 'Home' },
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
  const desktop = width >= 1024;
  const [tab, setTab] = useState<Tab>('home');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(initialEditing);

  const load = async () => {
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

  useEffect(() => { load(); }, []);

  const earnings = useMemo(() => transactions.reduce((s, t) => s + Number(t.Total_Amount || 0), 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), [transactions]);
  const topService = useMemo(() => {
    const counts = transactions.reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.Service_Name]: (acc[t.Service_Name] ?? 0) + 1 }), {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'No transactions yet';
  }, [transactions]);

  const patchForm = (section: keyof typeof initialForm, field: string, value: string) => setForm((c) => ({ ...c, [section]: { ...c[section], [field]: value } }));
  const reset = (section: keyof typeof initialForm) => { setForm((c) => ({ ...c, [section]: initialForm[section] })); setEditing((c) => ({ ...c, [section]: null })); };
  const showError = (e: unknown, fallback: string) => Alert.alert('Error', e instanceof Error ? e.message : fallback);
  const confirmDelete = (msg: string, fn: () => Promise<void>) => Alert.alert('Delete record', msg, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await fn(); await load(); } catch (e) { showError(e, 'Unable to delete the record.'); } } }]);

  const saveEmployee = async () => {
    const v = form.employees;
    if (!v.First_Name || !v.Last_Name || !v.Contact_No || !v.Hire_Date || !v.Salary || !v.Status || (!editing.employees && !v.Password)) return Alert.alert('Missing fields', 'Complete all employee details first.');
    setSubmitting(true);
    try {
      const payload = { ...v, Salary: Number(v.Salary) };
      editing.employees ? await updateEmployee(editing.employees, payload) : await createEmployee(payload);
      reset('employees'); await load();
    } catch (e) { showError(e, 'Unable to save employee.'); } finally { setSubmitting(false); }
  };
  const saveService = async () => {
    const v = form.services;
    if (!v.Service_Name || !v.Price) return Alert.alert('Missing fields', 'Complete the service details first.');
    setSubmitting(true);
    try {
      editing.services ? await updateService(editing.services, { Service_Name: v.Service_Name, Price: Number(v.Price) }) : await createService({ Service_Name: v.Service_Name, Price: Number(v.Price) });
      reset('services'); await load();
    } catch (e) { showError(e, 'Unable to save service.'); } finally { setSubmitting(false); }
  };
  const saveAppointment = async () => {
    const v = form.appointments;
    if (!v.Service_Name || !v.Customer_Name || !v.Appointment_Date || !v.Appointment_Time || !v.Status) return Alert.alert('Missing fields', 'Complete the appointment details first.');
    setSubmitting(true);
    try {
      editing.appointments ? await updateAppointment(editing.appointments, v) : await createAppointment(v);
      reset('appointments'); await load();
    } catch (e) { showError(e, 'Unable to save appointment.'); } finally { setSubmitting(false); }
  };
  const saveTransaction = async () => {
    const v = form.transactions;
    if (!v.Customer_Name || !v.Service_Name || !v.Total_Amount || !v.Payment_Method || !v.Payment_Status) return Alert.alert('Missing fields', 'Complete the transaction details first.');
    setSubmitting(true);
    try {
      const payload = { ...v, Total_Amount: Number(v.Total_Amount) };
      editing.transactions ? await updateTransaction(editing.transactions, payload) : await createTransaction(payload);
      reset('transactions'); await load();
    } catch (e) { showError(e, 'Unable to save transaction.'); } finally { setSubmitting(false); }
  };

  return (
    <View style={s.screen}>
      <View style={[s.frame, !desktop && s.frameMobile]}>
        <View style={[s.sidebar, !desktop && s.sidebarMobile]}>
          <View style={s.sidebarHeader}>
            <Image source={require('@/assets/images/bbshop.png')} style={s.sidebarLogo} resizeMode="contain" />
            <View style={s.sidebarTitleWrap}>
              <Text style={s.systemEyebrow}>Barbershop System</Text>
              <Text style={s.systemSub}>admin page</Text>
            </View>
          </View>
          <View style={s.sidebarBox}>
            {tabs.map((item) => (
              <Pressable key={item.key} onPress={() => setTab(item.key)} style={[s.navItem, tab === item.key && s.navItemActive]}>
                <Text style={[s.navText, tab === item.key && s.navTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <ScrollView style={s.content} contentContainerStyle={s.contentInner}>
          <View style={s.topBar}>
            <Text style={s.pageTitle}>{tab === 'home' ? 'Home' : tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
            <Image source={require('@/assets/images/bbshop.png')} style={s.logo} resizeMode="contain" />
          </View>

          {loading ? <StateCard><ActivityIndicator size="large" color="#927039" /></StateCard> : null}
          {!loading && error ? <StateCard><Text style={s.errorText}>{error}</Text></StateCard> : null}

          {!loading && !error && tab === 'home' ? (
            <View style={s.homeWrap}>
              <Text style={s.welcome}>Welcome, User</Text>
              <View style={[s.summaryRow, !desktop && s.summaryRowStack]}>
                <Summary label="Total Monthly Earnings" value={`P ${earnings}`} />
                <Summary label="Most Purchased Service" value={topService} light />
              </View>
            </View>
          ) : null}

          {!loading && !error && tab === 'employees' ? (
            <>
              <Panel title="Employees" subtitle="Manage employee records.">
                <FormGrid>
                  <Field label="First Name" value={form.employees.First_Name} onChangeText={(v) => patchForm('employees', 'First_Name', v)} />
                  <Field label="Last Name" value={form.employees.Last_Name} onChangeText={(v) => patchForm('employees', 'Last_Name', v)} />
                  <Field label="Contact No" value={form.employees.Contact_No} onChangeText={(v) => patchForm('employees', 'Contact_No', v)} />
                  <Field label="Hire Date" value={form.employees.Hire_Date} onChangeText={(v) => patchForm('employees', 'Hire_Date', v)} placeholder="YYYY-MM-DD" />
                  <Field label="Salary" value={form.employees.Salary} onChangeText={(v) => patchForm('employees', 'Salary', v)} keyboardType="numeric" />
                  <Field label="Status" value={form.employees.Status} onChangeText={(v) => patchForm('employees', 'Status', v)} />
                  <Field label={editing.employees ? 'New Password' : 'Password'} value={form.employees.Password} onChangeText={(v) => patchForm('employees', 'Password', v)} secureTextEntry />
                </FormGrid>
                <ActionRow loading={submitting} editing={Boolean(editing.employees)} onSave={saveEmployee} onCancel={() => reset('employees')} />
              </Panel>
              <DataTable
                title="Employee Records"
                headers={['Employee_ID', 'First_Name', 'Last_Name', 'Contact_No', 'Hire_Date', 'Salary', 'Status']}
                rows={employees.map((row) => [String(row.Employee_ID), row.First_Name, row.Last_Name, row.Contact_No, row.Hire_Date, Number(row.Salary).toFixed(2), row.Status])}
                onEdit={(i) => {
                  const row = employees[i];
                  setEditing((c) => ({ ...c, employees: row.Employee_ID }));
                  setForm((c) => ({ ...c, employees: { First_Name: row.First_Name, Last_Name: row.Last_Name, Contact_No: row.Contact_No, Hire_Date: row.Hire_Date, Salary: String(row.Salary), Status: row.Status, Password: '' } }));
                }}
                onDelete={(i) => {
                  const row = employees[i];
                  confirmDelete(`Delete ${row.First_Name} ${row.Last_Name}?`, async () => { await deleteEmployee(row.Employee_ID); if (editing.employees === row.Employee_ID) reset('employees'); });
                }}
              />
            </>
          ) : null}

          {!loading && !error && tab === 'services' ? (
            <>
              <Panel title="Services" subtitle="Maintain available services and pricing.">
                <FormGrid>
                  <Field label="Service Name" value={form.services.Service_Name} onChangeText={(v) => patchForm('services', 'Service_Name', v)} />
                  <Field label="Price" value={form.services.Price} onChangeText={(v) => patchForm('services', 'Price', v)} keyboardType="numeric" />
                </FormGrid>
                <ActionRow loading={submitting} editing={Boolean(editing.services)} onSave={saveService} onCancel={() => reset('services')} />
              </Panel>
              <DataTable
                title="Service Records"
                headers={['Service_ID', 'Service_Name', 'Price']}
                rows={services.map((row) => [row.Service_ID, row.Service_Name, Number(row.Price).toFixed(2)])}
                onEdit={(i) => {
                  const row = services[i];
                  setEditing((c) => ({ ...c, services: row.Service_ID }));
                  setForm((c) => ({ ...c, services: { Service_Name: row.Service_Name, Price: String(row.Price) } }));
                }}
                onDelete={(i) => {
                  const row = services[i];
                  confirmDelete(`Delete ${row.Service_Name}?`, async () => { await deleteService(row.Service_ID); if (editing.services === row.Service_ID) reset('services'); });
                }}
              />
            </>
          ) : null}

          {!loading && !error && tab === 'appointments' ? (
            <>
              <Panel title="Appointments" subtitle="Track and update bookings.">
                <FormGrid>
                  <Field label="Service Name" value={form.appointments.Service_Name} onChangeText={(v) => patchForm('appointments', 'Service_Name', v)} />
                  <Field label="Customer Name" value={form.appointments.Customer_Name} onChangeText={(v) => patchForm('appointments', 'Customer_Name', v)} />
                  <Field label="Date" value={form.appointments.Appointment_Date} onChangeText={(v) => patchForm('appointments', 'Appointment_Date', v)} placeholder="YYYY-MM-DD" />
                  <Field label="Time" value={form.appointments.Appointment_Time} onChangeText={(v) => patchForm('appointments', 'Appointment_Time', v)} placeholder="10:00:00" />
                  <Field label="Status" value={form.appointments.Status} onChangeText={(v) => patchForm('appointments', 'Status', v)} />
                </FormGrid>
                <ActionRow loading={submitting} editing={Boolean(editing.appointments)} onSave={saveAppointment} onCancel={() => reset('appointments')} />
              </Panel>
              <DataTable
                title="Appointment Records"
                headers={['Appointment_ID', 'Service_Name', 'Customer_Name', 'Appointment_Date', 'Appointment_Time', 'Status']}
                rows={appointments.map((row) => [String(row.Appointment_ID), row.Service_Name, row.Customer_Name, row.Appointment_Date, row.Appointment_Time, row.Status])}
                onEdit={(i) => {
                  const row = appointments[i];
                  setEditing((c) => ({ ...c, appointments: row.Appointment_ID }));
                  setForm((c) => ({ ...c, appointments: { Service_Name: row.Service_Name, Customer_Name: row.Customer_Name, Appointment_Date: row.Appointment_Date, Appointment_Time: row.Appointment_Time, Status: row.Status } }));
                }}
                onDelete={(i) => {
                  const row = appointments[i];
                  confirmDelete(`Delete appointment for ${row.Customer_Name}?`, async () => { await deleteAppointment(row.Appointment_ID); if (editing.appointments === row.Appointment_ID) reset('appointments'); });
                }}
              />
            </>
          ) : null}

          {!loading && !error && tab === 'transactions' ? (
            <>
              <Panel title="Transactions" subtitle="Manage completed sales and payment status.">
                <FormGrid>
                  <Field label="Customer Name" value={form.transactions.Customer_Name} onChangeText={(v) => patchForm('transactions', 'Customer_Name', v)} />
                  <Field label="Service Name" value={form.transactions.Service_Name} onChangeText={(v) => patchForm('transactions', 'Service_Name', v)} />
                  <Field label="Total Amount" value={form.transactions.Total_Amount} onChangeText={(v) => patchForm('transactions', 'Total_Amount', v)} keyboardType="numeric" />
                  <Field label="Payment Method" value={form.transactions.Payment_Method} onChangeText={(v) => patchForm('transactions', 'Payment_Method', v)} />
                  <Field label="Payment Status" value={form.transactions.Payment_Status} onChangeText={(v) => patchForm('transactions', 'Payment_Status', v)} />
                </FormGrid>
                <ActionRow loading={submitting} editing={Boolean(editing.transactions)} onSave={saveTransaction} onCancel={() => reset('transactions')} />
              </Panel>
              <DataTable
                title="Transaction Records"
                headers={['Transaction_ID', 'Customer_Name', 'Service_Name', 'Total_Amount', 'Payment_Method', 'Payment_Status']}
                rows={transactions.map((row) => [String(row.Transaction_ID), row.Customer_Name, row.Service_Name, Number(row.Total_Amount).toFixed(2), row.Payment_Method, row.Payment_Status])}
                onEdit={(i) => {
                  const row = transactions[i];
                  setEditing((c) => ({ ...c, transactions: row.Transaction_ID }));
                  setForm((c) => ({ ...c, transactions: { Customer_Name: row.Customer_Name, Service_Name: row.Service_Name, Total_Amount: String(row.Total_Amount), Payment_Method: row.Payment_Method, Payment_Status: row.Payment_Status } }));
                }}
                onDelete={(i) => {
                  const row = transactions[i];
                  confirmDelete(`Delete transaction for ${row.Customer_Name}?`, async () => { await deleteTransaction(row.Transaction_ID); if (editing.transactions === row.Transaction_ID) reset('transactions'); });
                }}
              />
            </>
          ) : null}

          <View style={s.footer}>
            <Text style={s.footerTitle}>Premier Barbershop System</Text>
            <Text style={s.footerText}>Designed and developed by Recon Tech.</Text>
            <Text style={s.footerText}>Administrative dashboard for employee, service, appointment, and transaction management.</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function StateCard({ children }: { children: React.ReactNode }) { return <View style={s.stateCard}>{children}</View>; }
function Summary({ label, value, light }: { label: string; value: string; light?: boolean }) { return <View style={[s.summary, light && s.summaryLight]}><Text style={s.summaryLabel}>{label}</Text><Text style={s.summaryValue}>{value}</Text></View>; }
function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <View style={s.panel}><Text style={s.panelTitle}>{title}</Text><Text style={s.panelSubtitle}>{subtitle}</Text>{children}</View>; }
function FormGrid({ children }: { children: React.ReactNode }) { return <View style={s.grid}>{children}</View>; }
function Field({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: 'default' | 'numeric' | 'phone-pad'; secureTextEntry?: boolean }) { return <View style={s.field}><Text style={s.fieldLabel}>{label}</Text><TextInput style={s.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9a958b" keyboardType={keyboardType} secureTextEntry={secureTextEntry} /></View>; }
function ActionRow({ loading, editing, onSave, onCancel }: { loading: boolean; editing: boolean; onSave: () => void; onCancel: () => void }) { return <View style={s.actionWrap}>{editing ? <Pressable style={s.cancelBtn} onPress={onCancel}><Text style={s.cancelTxt}>Cancel</Text></Pressable> : null}<Pressable style={s.saveBtn} onPress={onSave} disabled={loading}><Text style={s.saveTxt}>{loading ? 'Saving...' : editing ? 'Update Record' : 'Save Record'}</Text></Pressable></View>; }
function DataTable({ title, headers, rows, onEdit, onDelete }: { title: string; headers: string[]; rows: string[][]; onEdit: (index: number) => void; onDelete: (index: number) => void }) {
  return <Panel title={title} subtitle="Edit or delete any row.">{rows.length === 0 ? <Text style={s.empty}>No records found.</Text> : <ScrollView horizontal showsHorizontalScrollIndicator={false}><View><View style={s.tableHeader}>{headers.map((h) => <Cell key={h} header text={h} />)}<Cell header text="Actions" /></View>{rows.map((row, i) => <View key={`${title}-${i}`} style={s.tableRow}>{row.map((cell, j) => <Cell key={`${i}-${j}`} text={cell} />)}<View style={s.cell}><View style={s.rowActions}><Pressable style={s.editBtn} onPress={() => onEdit(i)}><Text style={s.editTxt}>Edit</Text></Pressable><Pressable style={s.deleteBtn} onPress={() => onDelete(i)}><Text style={s.deleteTxt}>Delete</Text></Pressable></View></View></View>)}</View></ScrollView>}</Panel>;
}
function Cell({ text, header }: { text: string; header?: boolean }) { return <View style={[s.cell, header && s.headerCell]}><Text style={header ? s.headerText : s.cellText}>{text}</Text></View>; }

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#e9e4db', padding: 16 },
  frame: { flex: 1, flexDirection: 'row', backgroundColor: '#eceae6', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#d7d0c3' },
  frameMobile: { flexDirection: 'column' },
  sidebar: { width: 234, backgroundColor: '#e9e4db', paddingTop: 22, paddingHorizontal: 16, borderRightWidth: 1, borderRightColor: '#d5cec1' },
  sidebarMobile: { width: '100%', paddingBottom: 20 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: '#d6cfc2', marginBottom: 16 },
  sidebarLogo: { width: 52, height: 52 },
  sidebarTitleWrap: { flex: 1 },
  systemEyebrow: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, color: '#9a7636' },
  systemTitle: { fontSize: 22, fontWeight: '800', color: '#2a2216', lineHeight: 24, marginTop: 2 },
  systemSub: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: '#8a8172', marginTop: 4 },
  sidebarBox: { paddingTop: 2, paddingBottom: 4 },
  navItem: { paddingHorizontal: 18, paddingVertical: 15, borderRadius: 14, marginVertical: 2 },
  navItemActive: { backgroundColor: '#f8f3e9', borderWidth: 1, borderColor: '#d1b06e' },
  navText: { fontSize: 17, fontWeight: '700', color: '#31281c' },
  navTextActive: { color: '#8f6f2f' },
  content: { flex: 1, backgroundColor: '#f9f8f6' },
  contentInner: { paddingHorizontal: 22, paddingVertical: 18, gap: 18 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 6 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#111' },
  logo: { width: 68, height: 68 },
  stateCard: { minHeight: 180, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d9d4cb', justifyContent: 'center', alignItems: 'center', borderRadius: 18 },
  errorText: { color: '#9c3b31', fontSize: 15, fontWeight: '600' },
  homeWrap: { alignItems: 'center', paddingVertical: 12 },
  welcome: { fontSize: 58, fontWeight: '800', color: '#5f5f5f', textAlign: 'center', textShadowColor: '#fff', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 1, marginBottom: 42 },
  summaryRow: { width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 28 },
  summaryRowStack: { flexDirection: 'column', alignItems: 'center' },
  summary: { width: 390, maxWidth: '100%', backgroundColor: '#5f5f5f', borderRadius: 18, paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center', shadowColor: '#5f5f5f', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: 6 },
  summaryLight: { backgroundColor: '#b0b0b0' },
  summaryLabel: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', textShadowColor: '#4d4d4d', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 1 },
  summaryValue: { fontSize: 42, color: '#fff', marginTop: 10, textAlign: 'center', textShadowColor: '#5b5b5b', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 1 },
  panel: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd8cf', padding: 22, borderRadius: 18, shadowColor: '#9a8f7a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 },
  panelTitle: { fontSize: 20, fontWeight: '800', color: '#141414', marginBottom: 6 },
  panelSubtitle: { fontSize: 14, color: '#716b61', marginBottom: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  field: { minWidth: 220, flexGrow: 1, flexBasis: 220 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#544b3d', marginBottom: 7 },
  input: { backgroundColor: '#f8f6f1', borderWidth: 1, borderColor: '#cfc7b8', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#1a1a1a', fontSize: 15 },
  actionWrap: { marginTop: 18, flexDirection: 'row', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' },
  saveBtn: { backgroundColor: '#8b6b33', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 13, borderWidth: 1, borderColor: '#735723', shadowColor: '#8b6b33', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 14, elevation: 4 },
  saveTxt: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  cancelBtn: { backgroundColor: '#ece7dc', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, borderWidth: 1, borderColor: '#d4cab9' },
  cancelTxt: { color: '#4c4130', fontSize: 14, fontWeight: '700' },
  empty: { color: '#80786c', fontSize: 14 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#fbfaf8', borderWidth: 1, borderColor: '#d4d1cb' },
  tableRow: { flexDirection: 'row', backgroundColor: '#fff', borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#d4d1cb', alignItems: 'stretch' },
  cell: { width: 150, paddingHorizontal: 16, paddingVertical: 16, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#d4d1cb' },
  headerCell: { paddingVertical: 14 },
  headerText: { fontSize: 13, fontWeight: '800', color: '#232323', textAlign: 'center' },
  cellText: { fontSize: 13, fontWeight: '700', color: '#222', textAlign: 'center', flexWrap: 'wrap' },
  rowActions: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  editBtn: { backgroundColor: '#f5eddd', borderWidth: 1, borderColor: '#dbc28c', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, shadowColor: '#8f7440', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  editTxt: { color: '#8a6b33', fontSize: 12, fontWeight: '700' },
  deleteBtn: { backgroundColor: '#fff0ef', borderWidth: 1, borderColor: '#f1c5c2', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, shadowColor: '#c3473c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
  deleteTxt: { color: '#c3473c', fontSize: 12, fontWeight: '700' },
  footer: { marginTop: 10, paddingTop: 8, paddingBottom: 6, alignItems: 'center' },
  footerTitle: { fontSize: 14, fontWeight: '800', color: '#5f4615' },
  footerText: { fontSize: 12, color: '#7c7366', textAlign: 'center', marginTop: 4, maxWidth: 760 },
});
