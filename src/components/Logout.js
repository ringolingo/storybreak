import React from 'react';
import { GoogleLogout } from 'react-google-login';

const clientId = "195198641210-o0725v1k4223tg8v6t5qep3dd463f5q6.apps.googleusercontent.com";

const Logout = ({setUser}) => {
    const onSuccess = () => {
        alert('you have logged out');
        setUser({
            id: null,
            email: '',
            first_name: '',
            last_name: '',
        });
    };

    return (
        <div>
            <GoogleLogout 
                clientId={clientId}
                buttonText="Logout"
                onLogoutSuccess={onSuccess}
                render={renderProps => (
                    <button onClick={renderProps.onClick} disabled={renderProps.disabled} className="btn btn-block">Log Out</button>
                )}
                className="btn btn-secondary google-log-btn"
            />
        </div>
    )
}

export default Logout;