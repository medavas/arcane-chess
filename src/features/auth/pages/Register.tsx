import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import Button from 'src/shared/components/Button/Button';
import Input from 'src/shared/components/Input/Input';
import Hero from 'src/shared/components/hero2/Hero';

import { registerUser } from 'src/features/auth/store/authActions';

import { useNavigate } from 'react-router-dom';

const UnwrappedRegister = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const loginRegisterErrors = useSelector(
    (state: any) => state.loginRegisterErrors
  );

  // Adjusted the onChange function to fit the new Input component
  const onChange = (name: string, value: string) => {
    if (name === 'username') setUsername(value);
    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
    if (name === 'password2') setPassword2(value);
  };

  const onSubmitReg = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newUser = {
      username: username,
      email: email,
      password: password,
      password2: password2,
    };

    // and navigate to the login page
    dispatch(registerUser(newUser, navigate));
  };

  const handleEnterClick = (path: string) => {
    setFadeOut(true);
    setTimeout(() => {
      navigate(path);
    }, 300);
  };

  useEffect(() => {
    setTimeout(() => {
      setFadeIn(true);
    }, 50);
  }, []);

  return (
    <div
      className={`register-page ${fadeIn ? 'fade-in' : ''} ${
        fadeOut ? 'fade-out' : ''
      }`}
    >
      <div className={`fade-overlay ${fadeOut ? 'active' : ''}`} />
      <Hero />
      <form noValidate onSubmit={onSubmitReg} className="view">
        <img className="logo" src={'/assets/logoall+.png'} alt="" />
        <div className="login-info">
          <span>
            By registering, you agree to our{' '}
            <Link
              to="/manifest?tab=tos"
              style={{
                color: '#007BFF',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              to="/manifest?tab=privacy"
              style={{
                color: '#007BFF',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Privacy Policy
            </Link>
            .
          </span>
        </div>

        <div></div>
        <div className="reg-input-top">
          <div className="reg-inputs">
            <Input
              className="primary"
              color={'S'}
              width={180}
              height={40}
              placeholder={'Username'}
              value={username} // Changed to use the value prop
              onChange={(value) => onChange('username', value)}
              password={false}
              styles={{ margin: '2px' }}
            />
            <Input
              className="primary"
              color={'S'}
              width={180}
              height={40}
              placeholder={'Email'}
              value={email} // Changed to use the value prop
              onChange={(value) => onChange('email', value)}
              password={false}
              styles={{ margin: '2px' }}
            />
            <Input
              className="primary"
              color={'S'}
              width={180}
              height={40}
              placeholder={'Password'}
              value={password} // Changed to use the value prop
              onChange={(value) => onChange('password', value)}
              password={true}
              styles={{ margin: '2px' }}
            />
            <Input
              className="primary"
              color={'S'}
              width={180}
              height={40}
              placeholder={'Confirm Password'}
              value={password2} // Changed to use the value prop
              onChange={(value) => onChange('password2', value)}
              password={true}
              styles={{ margin: '2px' }}
            />
          </div>
          <div className="reg-buttons">
            <div className="mini-buttons">
              <Button
                className="tertiary"
                text={'LOGIN'}
                color={'S'}
                width={80}
                height={30}
                fontSize={12}
                onClick={() => handleEnterClick('/login')}
              />
              <Button
                className="tertiary"
                text={'HOME'}
                color={'S'}
                width={80}
                height={30}
                fontSize={12}
                onClick={() => handleEnterClick('/intro')}
              />
            </div>
            <Button
              text={'REGISTER'}
              color={'S'}
              width={140}
              height={40}
              disabled={false}
              submit={true}
              styles={{ margin: '2px' }}
            />
          </div>
          <div className="reg-errors">
            {_.map(loginRegisterErrors, (value, i) => {
              console.log(loginRegisterErrors);
              return (
                <span className="reg-error" key={i}>
                  {value}
                </span>
              );
            })}
          </div>
        </div>
      </form>
    </div>
  );
};

export const Register = UnwrappedRegister;
