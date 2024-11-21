import React, { useContext, useEffect, useState } from 'react';
import { BookingContext } from './BookingContext';
import CustomCalendar from './CustomCalendar';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import logo from './assets/emlogo.png';
import './CreateBook.css';

const TimeDatePayment = () => {
    const { formData, setFormData } = useContext(BookingContext);
    const [availableTimes] = useState([
        '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
        '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
    ]);
    const [bookedTimes, setBookedTimes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [notification, setNotification] = useState('');
    const [showNotificationCard, setShowNotificationCard] = useState(false);
    const navigate = useNavigate();

    const [customerName, setCustomerName] = useState(formData.name || '');
    const [selectedDate, setSelectedDate] = useState(formData.date || '');
    const [selectedTime, setSelectedTime] = useState(formData.time || '');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(formData.paymentMethod || '');
    const [customerEmail, setCustomerEmail] = useState(formData.email || '');
    const [customerContactNo, setCustomerContactNo] = useState(formData.contactNo || '');
    

    useEffect(() => {
        const fetchBookedTimes = async () => {
            if (selectedDate) {
                setLoading(true);
                try {
                    const response = await axios.post('http://localhost:3030/booked-times', { date: selectedDate });
                    setBookedTimes(response.data);
                } catch (error) {
                    console.error('Error fetching booked times:', error);
                    setNotification('Failed to fetch booked times. Please try again.');
                    setShowNotificationCard(true);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchBookedTimes();
    }, [selectedDate]);

    const handleTimeSelect = async (time) => {
        const response = await fetch('http://localhost:3030/check-availability', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date: selectedDate, time }),
        });
        
        const data = await response.json();
    
        if (response.ok) {
            setFormData({ ...formData, time });
            setSelectedTime(time);
            setNotification('');
            setShowNotificationCard(false);
        } else {
            setNotification(data.message);
            setShowNotificationCard(true);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (name === 'contactNo') {
            setCustomerContactNo(value);
        }
    };

    const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    // Set form data with selected date and time
    const updatedFormData = {
        ...formData,
        date: selectedDate,
        time: selectedTime,
        contactNo: customerContactNo, // Ensure contact number is included
        paymentMethod: selectedPaymentMethod,
    };
    setFormData(updatedFormData);
    setNotification('Booking information reviewed successfully!');
    navigate('/billing-interface');
};

    const handleBack = () => {
        navigate('/services-barber');
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const filteredAvailableTimes = availableTimes.filter(time => !bookedTimes.includes(time));

    const closeNotificationCard = () => {
        setShowNotificationCard(false);
    };

    return (
        <>
            <Link to="/" style={{ position: 'absolute', top: '45px', left: '73px' }}>
                <img src={logo} alt="Logo" style={{ width: '55px', height: 'auto' }} />
            </Link>

            <div className="hamburger" onClick={toggleMenu}>
                <div className={isMenuOpen ? "bar bar1 open" : "bar bar1"}></div>
                <div className={isMenuOpen ? "bar bar2 open" : "bar bar2"}></div>
                <div className={isMenuOpen ? "bar bar3 open" : "bar bar3"}></div>
            </div>

            {isMenuOpen && (
                <div className="menu">
                    <Link to="/">Home</Link>
                    <Link to="/about">About Us</Link>
                    <Link to="/services">Services</Link>
                </div>
            )}

            <div className="timeDatePayment-container" aria-live="polite">
                <div className="formGroup">
                    <label style={{ color: 'white' }}>Date</label>
                    <CustomCalendar selectedDate={selectedDate} onDateChange={(date) => {
                        setFormData({ ...formData, date });
                        setSelectedDate(date);
                    }} />
                </div>

                <div className="time-grid">
                    {loading ? (
                        <div>Loading available times...</div>
                    ) : (
                        filteredAvailableTimes.length > 0 ? (
                            filteredAvailableTimes.map((time) => (
                                <div
                                    key={time}
                                    className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                                    onClick={() => handleTimeSelect(time)}
                                >
                                    {time}
                                </div>
                            ))
                        ) : (
                            <div className="no-available-times">No available times for this date.</div>
                        )
                    )}
                </div>

                {showNotificationCard && (
                    <div className="notification-card">
                        <div className="notification-message">{notification}</div>
                        <button className="notification-button" onClick={closeNotificationCard}>OK</button>
                    </div>
                )}

                <div className="formGroup">
                    <label style={{ color: 'white' }}>Contact Number</label>
                    <input
                        type="tel"
                        name="contactNo"
                        value={customerContactNo}
                        onChange={handleInputChange}
                        placeholder="Enter your contact number"
                        required
                        className="input-field"
                    />
                </div>

                <div className="formGroup">
                    <label style={{ color: 'white' }}>Payment Method</label>
                    <select
                        name="paymentMethod"
                        value={selectedPaymentMethod}
                        onChange={(e) => {
                            handleInputChange(e);
                            setSelectedPaymentMethod(e.target.value);
                        }}
                        className="dropdown"
                        required
                    >
                        <option value="" disabled>Select Payment Method</option>
                        <option value="Pay in Store">Pay in Store</option>
                    </select>
                </div>

                <div className="button-container">
                    <button onClick={handleBack} className="back-button">
                        Back
                    </button>
                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner-border text-primary" role="status">
                                <span className="sr-only">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <button onClick={handleSubmit} className="submitBooking-button" disabled={!selectedTime}>
                            Continue to Billing
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default TimeDatePayment;