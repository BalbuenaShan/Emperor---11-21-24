import express from 'express';
import mysql from 'mysql';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { format, parse } from 'date-fns';

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json());
app.use(cors());

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "crud"
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Function to convert 12-hour time format to 24-hour format
const convertTimeTo24Hour = (time12h) => {
    return format(parse(time12h, 'h:mm a', new Date()), 'HH:mm:ss');
};

// GET route to retrieve all customers
app.get('/customers', (req, res) => {
    const sql = "SELECT * FROM Customer";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error retrieving customers:", err);
            return res.status(500).json({ Error: "Error retrieving customers" });
        }
        return res.json(results);
    });
});

// GET route to retrieve all bookings with customer details
app.get('/bookings', (req, res) => {
    const sql = `
        SELECT 
            b.id, 
            c.name AS customerName, 
            b.contactNo, 
            s.serviceType, 
            st.staffName, 
            s.servicePrice, 
            b.date, 
            b.time, 
            b.paymentMethod, 
            b.status 
        FROM 
            Booking b
        JOIN 
            Customer c ON b.customerID = c.customerID
        JOIN 
            Services s ON b.serviceID = s.serviceID
        JOIN 
            Staff st ON b.staffID = st.staffID
    `;
    db.query(sql, (err, data) => {
        if (err) {
            console.error("Error retrieving bookings:", err);
            return res.status(500).json({ Error: "Error retrieving bookings" });
        }
        return res.json(data);
    });
});

// GET route to retrieve services by service type
app.get('/services', (req, res) => {
    const { serviceType } = req.query;
    const sql = "SELECT * FROM Services WHERE serviceType = ?";
    db.query(sql, [serviceType], (err, results) => {
        if (err) {
            console.error("Error fetching service:", err);
            return res.status(500).json({ Error: "Error fetching service" });
        }
        return res.json(results);
    });
});

// GET route to retrieve all staff members
app.get('/staff', (req, res) => {
    const sql = "SELECT staffID, staffName FROM Staff"; // Query to select staff members

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error retrieving staff:", err);
            return res.status(500).json({ error: "Error retrieving staff" });
        }

        // Check if results are empty
        if (results.length === 0) {
            return res.status(404).json({ message: "No staff members found." });
        }

        return res.json(results); // Return the results as JSON
    });
});

// POST route to create a new booking (with email notification)
app.post('/submit-booking', (req, res) => {
    const { name, service, date, time, paymentMethod, email, contactNo, staffID } = req.body; // Added staffID here
    const formattedDate = format(new Date(date), 'yyyy-MM-dd');
    const timeIn24h = convertTimeTo24Hour(time);

    console.log('Received staffID:', staffID); // Log the staffID

    // Update the query to fetch serviceID and staffID
    const getServiceSql = "SELECT serviceID, servicePrice FROM Services WHERE serviceType = ?";
    db.query(getServiceSql, [service], (err, serviceResults) => {
        if (err) {
            console.error("Error fetching service ID:", err);
            return res.status(500).json({ Error: "Error fetching service ID" });
        }

        if (serviceResults.length === 0) {
            return res.status(400).json({ Error: "Service not found" });
        }

        // Destructure the serviceID and servicePrice from the results
        const { serviceID, servicePrice } = serviceResults[0];

        const checkSql = "SELECT * FROM Booking WHERE date = ? AND time = ?";
        db.query(checkSql, [formattedDate, timeIn24h], (err, results) => {
            if (err) {
                console.error("Error checking availability:", err);
                return res.status(500).json({ Error: "Error checking availability" });
            }

            if (results.length > 0) {
                return res.status(400).json({ message: 'Time slot is already booked.' });
            }

            const insertCustomerSql = "INSERT INTO Customer (name, contactNo, email) VALUES (?, ?, ?)";
            const customerValues = [name, contactNo, email];

            db.query(insertCustomerSql, customerValues, (err, customerData) => {
                if (err) {
                    console.error("Error inserting customer data:", err);
                    return res.status(500).json({ Error: "Error inserting customer data" });
                }

                const customerID = customerData.insertId;

                // Use the received staffID when inserting the booking
                const insertBookingSql = "INSERT INTO Booking (customerID, serviceID, staffID, name, contactNo, date, time, paymentMethod, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
                const bookingValues = [customerID, serviceID, staffID, name, contactNo, formattedDate, timeIn24h, paymentMethod, email];

                db.query(insertBookingSql, bookingValues, (err, bookingData) => {
                    if (err) {
                        console.error("Error inserting booking data:", err);
                        return res.status(500).json({ Error: "Error inserting booking data" });
                    }

                    // Fetch staff name for the email
                    const getStaffSql = "SELECT staffName FROM Staff WHERE staffID = ?";
                    db.query(getStaffSql, [staffID], (err, staffResults) => {
                        if (err) {
                            console.error("Error fetching staff name:", err);
                            return res.status(500).json({ Error: "Error fetching staff name" });
                        }

                        const staffName = staffResults.length > 0 ? staffResults[0].staffName : "N/A";

                        const mailOptions = {
                            from: process.env.EMAIL_USER,
                            to: email,
                            subject: 'Booking Confirmation',
                            text: `Dear ${name},\n\n` +
                                  `Thank you for your booking!\n` +
                                  `You have chosen the service: ${service}\n` +
                                  `Barber: ${staffName}\n` +
                                  `Date: ${formattedDate}\n` +
                                  `Time: ${time}\n` +
                                  `Total Price: ₱${servicePrice.toFixed(2)}\n\n` +  // Display price in pesos
                                  `If you wish to cancel your booking, just reply with "cancel".\n\n` +
                                  `Thank you for choosing us!\n\n` +
                                  `Best regards,\nYour Barbershop`,
                        };

                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                console.error('Error sending email:', error);
                                return res.status(500).json({ Error: "Error sending confirmation email" });
                            }
                            console.log('Email sent:', info.response);
                            return res.status(201).json({ message: "Booking created successfully, confirmation email sent", booking: bookingData });
                        });
                    });
                });
            });
        });
    });
});

// DELETE route to delete a booking
app.delete('/bookings/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM Booking WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error deleting booking:", err);
            return res.status(500).json({ Error: "Error deleting booking" });
        }
        return res.json({ message: "Booking deleted successfully" });
    });
});

// DELETE route to delete a customer
app.delete('/customers/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM Customer WHERE customerID = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error deleting customer:", err);
            return res.status(500).json({ Error: "Error deleting customer" });
        }
        return res.json({ message: "Customer deleted successfully" });
    });
});

// POST route to get booked times for a specific date
app.post('/booked-times', (req, res) => {
    const { date } = req.body;
    console.log("Received request for booked times:", date);

    const sql = "SELECT time FROM Booking WHERE date = ?";
    db.query(sql, [date], (err, results) => {
        if (err) {
            console.error("Error fetching booked times:", err);
            return res.status(500).json({ Error: "Error fetching booked times" });
        }

        const bookedTimes = results.map(row => row.time);
        return res.json(bookedTimes);
    });
});

// Endpoint to check availability of a specific time slot
app.post('/check-availability', (req, res) => {
    const { date, time } = req.body;
    const formattedDate = format(new Date(date), 'yyyy-MM-dd');
    const timeIn24h = convertTimeTo24Hour(time);

    const checkSql = "SELECT * FROM Booking WHERE date = ? AND time = ?";
    db.query(checkSql, [formattedDate, timeIn24h], (err, results) => {
        if (err) {
            console.error("Error checking availability:", err);
            return res.status(500).json({ Error: "Error checking availability" });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: 'Time slot is already booked.' });
        }

        return res.status(200).json({ message: 'Time slot is available.' });
    });
});

// Accept booking (change status from Pending to Completed)
app.put('/bookings/accept/:id', (req, res) => {
    const id = req.params.id;

    const fetchPriceSql = `
        SELECT s.servicePrice 
        FROM Booking b 
        JOIN Services s ON b.serviceID = s.serviceID 
        WHERE b.id = ?
    `;
    
    db.query(fetchPriceSql, [id], (err, results) => {
        if (err) {
            console.error("Error fetching service price:", err);
            return res.status(500).json({ Error: "Error fetching service price" });
        }
        
        if (results.length === 0) {
            return res.status(400).json({ message: "Booking not found" });
        }

        const servicePrice = results[0].servicePrice;

        const updateStatusSql = "UPDATE Booking SET status = 'Completed' WHERE id = ?";
        
        db.query(updateStatusSql, [id], (err, result) => {
            if (err) {
                console.error("Error updating booking status:", err);
                return res.status(500).json({ Error: "Error updating booking status" });
            }
            if (result.affectedRows === 0) {
                return res.status(400).json({ message: "Booking not found" });
            }

            const updateIncomeSql = "UPDATE Income SET totalIncome = totalIncome + ? WHERE id = 1";
            
            db.query(updateIncomeSql, [servicePrice], (err) => {
                if (err) {
                    console.error("Error updating total income:", err);
                    return res.status(500).json({ Error: "Error updating total income" });
                }
                return res.json({ message: "Booking status updated successfully" });
            });
        });
    });
});

// GET route to retrieve total bookings and total income
app.get('/totals', (req, res) => {
    const totalBookingsSql = "SELECT COUNT(*) AS totalBookings FROM Booking WHERE status = 'Completed'";
    const totalIncomeSql = "SELECT SUM(servicePrice) AS totalIncome FROM Booking b JOIN Services s ON b.serviceID = s.serviceID WHERE b.status = 'Completed'";

    db.query(totalBookingsSql, (err, bookingResults) => {
        if (err) {
            console.error("Error fetching total bookings:", err);
            return res.status(500).json({ Error: "Error fetching total bookings" });
        }

        db.query(totalIncomeSql, (err, incomeResults) => {
            if (err) {
                console.error("Error fetching total income:", err);
                return res.status(500).json({ Error: "Error fetching total income" });
            }

            const totalBookings = bookingResults[0].totalBookings;
            const totalIncome = incomeResults[0].totalIncome || 0; 

            return res.json({ totalBookings, totalIncome });
        });
    });
});

// GET route to retrieve total income
app.get('/income', (req, res) => {
    const sql = "SELECT totalIncome FROM Income WHERE id = 1"; 
    db.query(sql, (err, result) => {
        if (err) {
            console.error("Error retrieving total income:", err);
            return res.status(500).json({ Error: "Error retrieving total income" });
        }
        return res.json(result[0]);
    });
});

// POST route for login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const sql = "SELECT * FROM admin WHERE username = ?";
    db.query(sql, [username], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const admin = results[0];
        if (password !== admin.password) { 
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        return res.json({ message: 'Login successful' });
    });
});

// Start the server
const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});