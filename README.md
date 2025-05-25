# Bitespeed Identity Reconciliation Backend

## 1. Introduction

This project implements the Bitespeed Identity Reconciliation backend task.  
It provides a `/identify` API endpoint that consolidates customer identities across multiple orders using email and phone number.

The service links different orders made with different contact information to the same person, ensuring a seamless customer experience.

---

## 2. Hosted URL

> **API Base URL:**  
> [https://identity-management-zmzv.onrender.com](https://identity-management-zmzv.onrender.com)  


---

## 3. Usage

### **POST `/identify`**

**Request Body:**  
Send a JSON object with at least one of `email` or `phoneNumber`:

```bash
{
"email": "lorraine@hillvalley.edu",
"phoneNumber": "123456"
}
```

- You can also send:
```bash
{
"email": null, 
"phoneNumber": "123456" 
}
```
or
```bash
{
"email": "lorraine@hillvalley.edu",
"phoneNumber": null
}
```

**Response Example:**
```bash
{
"contact": {
"primaryContatctId": 1,
"emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
"phoneNumbers": ["123456"],
"secondaryContactIds":
}
}
```
## 4. Installation and Deployment

### **Local Setup**

1. **Clone the repository**
```bash
git clone https://github.com/anonzombie0309/Identity-Management.git
cd Identity-Management
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
- Create a `.env` file in the root directory:
```
DB_NAME=
DB_USER=
DB_PASS=
DB_HOST=
DB_PORT=
```
Enter the corresponding values for environment variables according to your database configuration.

4. **Start the server**
```bash
node app.js
```
The server will run on [http://localhost:3000](http://localhost:3000) by default.

5. **Tech Stack**

- **Node.js** (Express)
- **Sequelize** ORM
- **PostgreSQL**
- **Render.com** (for hosting)
- **Supabase** (for database)
- **Postman** (for API testing)

---




