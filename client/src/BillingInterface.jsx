import React, { useContext, useState } from 'react';
import { BookingContext } from './BookingContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BillingInterface.css';

const BillingInterface = () => {
    const { formData } = useContext(BookingContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    console.log("Form Data in Billing Interface:", formData);  // Confirm price presence

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        axios.post('http://localhost:3030/submit-booking', formData)
            .then((response) => {
                alert("Payment Confirmed!");
                navigate('/booking-done');
            })
            .catch((error) => {
                console.error("Error submitting booking:", error);
                setLoading(false);
            });
    };

    return (
        <div className="billing-container">
            <h2 className="billing">Billing Summary</h2>
            <div className="billing-details">
                <h3>Customer Details:</h3>
                <p>Name: {formData.name}</p>
                <p>Email: {formData.email}</p>
                <h3>Selected Service:</h3>
                <p>Service: {formData.service}</p>
                <p>Barber: {formData.barber}</p>
                <h3>Date & Time:</h3>
                <p>Date: {formData.date ? new Date(formData.date).toLocaleDateString() : 'Not selected'}</p>
                <p>Time: {formData.time || 'Not selected'}</p>
            </div>
            <div className="billing-total">
                <h3>Total Amount</h3>
                <p>₱{formData.price || 0}</p>
            </div>
            <div className="buttonGroup">
                <button onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Processing...' : 'Confirm Payment'}
                </button>
                <button onClick={() => navigate('/services-barber')}>Edit Details</button>
            </div>
        </div>
    );
};

export default BillingInterface;
