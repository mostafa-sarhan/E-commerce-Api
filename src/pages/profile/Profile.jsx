import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateMyProfile, changeMyPassword, getMyAddresses } from "../../services/api/userApi";
import {
  getLocalAccounts,
  saveLocalAccounts,
  findLocalAccount,
} from "../../services/localStore";
import "./Profile.css";

function Profile() {
  const { user, role, updateUser } = useAuth();
  const isLocalRole = role === "seller" || role === "admin";

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    password: "",
    rePassword: "",
  });
  const [addresses, setAddresses] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role !== "customer") return;
    getMyAddresses()
      .then((data) => setAddresses(data.data || []))
      .catch(() => setAddresses([]));
  }, [role]);

  async function saveProfile(e) {
    e.preventDefault();

    if (isLocalRole) {
      const account = findLocalAccount(user?.email);
      if (!account) return alert("Local account was not found.");

      const updated = getLocalAccounts().map((item) =>
        item.email === account.email
          ? { ...item, name: form.name, phone: form.phone }
          : item
      );

      saveLocalAccounts(updated);
      updateUser({ name: form.name, phone: form.phone });
      alert("Profile updated successfully.");
      return;
    }

    try {
      setSaving(true);
      const data = await updateMyProfile(form);
      updateUser(data.data || form);
      alert("Profile updated successfully.");
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();

    if (passwords.password !== passwords.rePassword) {
      return alert("New passwords do not match.");
    }

    if (isLocalRole) {
      const account = findLocalAccount(user?.email);
      if (!account) return alert("Local account was not found.");
      if (account.password !== passwords.currentPassword) {
        return alert("Current password is incorrect.");
      }

      saveLocalAccounts(
        getLocalAccounts().map((item) =>
          item.email === account.email
            ? { ...item, password: passwords.password }
            : item
        )
      );

      setPasswords({ currentPassword: "", password: "", rePassword: "" });
      alert("Password changed successfully.");
      return;
    }

    try {
      await changeMyPassword(passwords);
      setPasswords({ currentPassword: "", password: "", rePassword: "" });
      alert("Password changed successfully.");
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <main className="profile-page">
      <div className="page-header">
        <p>ACCOUNT</p>
        <h1>My Profile</h1>
        <span>Manage your personal information and security.</span>
      </div>

      <div className="profile-grid">
        <form className="profile-card" onSubmit={saveProfile}>
          <h2>Personal Information</h2>
          <label>
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input type="email" value={form.email} disabled />
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <button disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
        </form>

        <form className="profile-card" onSubmit={savePassword}>
          <h2>Change Password</h2>
          <label>
            Current Password
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, currentPassword: e.target.value })
              }
              required
            />
          </label>
          <label>
            New Password
            <input
              type="password"
              value={passwords.password}
              onChange={(e) =>
                setPasswords({ ...passwords, password: e.target.value })
              }
              required
            />
          </label>
          <label>
            Confirm Password
            <input
              type="password"
              value={passwords.rePassword}
              onChange={(e) =>
                setPasswords({ ...passwords, rePassword: e.target.value })
              }
              required
            />
          </label>
          <button>Change Password</button>
        </form>
      </div>

      {role === "customer" && (
        <section className="profile-card address-card">
          <h2>Saved Addresses</h2>
          {addresses.length ? (
            addresses.map((address) => (
              <div className="address-row" key={address._id}>
                <strong>{address.alias || "Address"}</strong>
                <span>
                  {address.details}, {address.city} · {address.phone}
                </span>
              </div>
            ))
          ) : (
            <p className="muted">No saved addresses returned by the API yet.</p>
          )}
        </section>
      )}
    </main>
  );
}

export default Profile;
