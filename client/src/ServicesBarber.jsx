import React, { useContext, useEffect, useState } from 'react';
import { BookingContext } from './BookingContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import logo from './assets/emlogo.png';
import './ServicesBarber.css';

const ServicesBarber = () => {
    const { formData, setFormData } = useContext(BookingContext);
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [barbers, setBarbers] = useState([]);

    useEffect(() => {
        const fetchBarbers = async () => {
            try {
                const response = await axios.get('http://localhost:3030/staff');
                setBarbers(response.data);
                console.log('Barbers loaded:', response.data);
            } catch (error) {
                console.error('Error fetching barbers:', error);
            }
        };
        fetchBarbers();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
    
        let price = formData.price;  // Retain existing price if other fields change
        if (name === "service") {
            switch (value) {
                case "Haircut": price = 400; break;
                case "Shampoo": price = 450; break;
                case "Massage": price = 500; break;
                case "Hot towel": price = 400; break;
                case "Blow dry": price = 500; break;
                default: break;
            }
        }
    
        setFormData((prevFormData) => {
            const updatedData = {
                ...prevFormData,
                [name]: value,
                price: price,
            };
            console.log("Updated formData after service selection:", updatedData); // Debug price
            return updatedData;
        });
    };
    
    const handleNext = async () => {
        if (!formData.service || !formData.barber) {
            alert("Please select a service and a barber.");
            return;
        }
    
        try {
            const serviceResponse = await axios.get(`http://localhost:3030/services?serviceType=${formData.service}`);
            if (serviceResponse.data.length === 0) {
                alert("Selected service is not available.");
                return;
            }
    
            const selectedService = serviceResponse.data[0];
    
            setFormData((prevFormData) => {
                const updatedData = {
                    ...prevFormData,
                    serviceID: selectedService.serviceID,
                    staffID: formData.barber,
                };
                console.log("Updated formData in handleNext:", updatedData);
                return updatedData;
            });
    
            // Small delay to allow `setFormData` to complete before navigating
            setTimeout(() => {
                navigate('/customer-details');
            }, 100);
        } catch (error) {
            console.error('Error fetching service:', error);
            alert("Failed to fetch service information. Please try again.");
        }
    };
    
    const handleBack = () => {
        navigate('/');
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
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

            <div className="container">
                <h2>Choose Service and Barber</h2>
                <div className="formGroup">
                    <label>Service</label>
                    <select name="service" value={formData.service || ''} onChange={handleInputChange} className="dropdown">
                        <option value="" disabled>Select a service</option>
                        <option value="Haircut">Haircut - ₱400</option>
                        <option value="Shampoo">Shampoo - ₱450</option>
                        <option value="Massage">Massage - ₱500</option>
                        <option value="Hot towel">Hot Towel - ₱400</option>
                        <option value="Blow dry">Blow Dry - ₱500</option>
                    </select>
                </div>
                <div className="formGroup">
                    <label>Barber</label>
                    <select name="barber" value={formData.barber || ''} onChange={handleInputChange} className="dropdown">
                        <option value="" disabled>Choose a barber</option>
                        {barbers.map(barber => (
                            <option key={barber.staffID} value={barber.staffID}>{barber.staffName}</option>
                        ))}
                    </select>
                </div>
                <div className="buttonGroup">
                    <button onClick={handleBack}>Back</button>
                    <button onClick={handleNext}>Next</button>
                </div>
            </div>
        </>
    );
};

export default ServicesBarber;
