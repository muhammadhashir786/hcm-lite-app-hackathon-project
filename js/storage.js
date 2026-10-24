// LocalStorage Keys constants
const STORAGE_KEYS = {
  COMPANY: "hcm_company",
  USERS: "hcm_users",
  ATTENDANCE: "hcm_attendance",
  LEAVES: "hcm_leaves",
  SESSION: "hcm_session"
};

// Generic read helper
function getStorageData(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

// Generic write helper
function setStorageData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    return false;
  }
}

// Specific Getters
function getCompany() {
  return getStorageData(STORAGE_KEYS.COMPANY, null);
}

function getUsers() {
  return getStorageData(STORAGE_KEYS.USERS, []);
}

function getAttendance() {
  return getStorageData(STORAGE_KEYS.ATTENDANCE, []);
}

function getLeaves() {
  return getStorageData(STORAGE_KEYS.LEAVES, []);
}

function getSession() {
  return getStorageData(STORAGE_KEYS.SESSION, null);
}

// Specific Setters / Updaters
function saveCompany(companyData) {
  return setStorageData(STORAGE_KEYS.COMPANY, companyData);
}

function saveUsers(usersArray) {
  return setStorageData(STORAGE_KEYS.USERS, usersArray);
}

function saveAttendance(attendanceArray) {
  return setStorageData(STORAGE_KEYS.ATTENDANCE, attendanceArray);
}

function saveLeaves(leavesArray) {
  return setStorageData(STORAGE_KEYS.LEAVES, leavesArray);
}

function saveSession(userSession) {
  return setStorageData(STORAGE_KEYS.SESSION, userSession);
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

// Announcements helpers
function getAnnouncement() {
  return getStorageData("hcm_announcement", "");
}

function saveAnnouncement(text) {
  return setStorageData("hcm_announcement", text);
}