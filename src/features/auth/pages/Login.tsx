import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import { useSelector, useDispatch } from 'react-redux';

import { useNavigate } from 'react-router-dom';

import './LoginRegister.scss';

import { audioManager } from 'src/shared/utils/audio/AudioManager';

import Button from 'src/shared/components/Button/Button';
import Input from 'src/shared/components/Input/Input';
import Hero from 'src/shared/components/hero2/Hero';

import {
  loginUser,
  getGuestUserFromLocalStorage,
} from 'src/features/auth/store/authActions';

interface UserData {
  username: string;
  password: string;
  guest: boolean;
}

const UnwrappedLogin: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  // const auth = useSelector((state: RootState) => state.auth);
  const loginRegisterErrors = useSelector(
    (state: any) => state.loginRegisterErrors || {}
  );

  // const router = useRoutes();
  // constructor(props) {
  //   super(props);
  //   this.state = {
  //     username: '',
  //     password: '',
  //     errors: {},
  //     panelType: this.router.location || 'login',
  //   };
  // }

  // const [panel, setPanel] = useState(useLocation() || 'login');

  // componentDidUpdate(nextProps) {
  //   if (nextProps.errors) {
  //     this.setState({
  //       errors: nextProps.errors,
  //     });
  //   }
  // }

  // const onChange = (e) => {
  //   e.preventDefault();
  //   this.setState({ [e.target.name]: e.target.value });
  // };

  const onChange = (name: string, value: string) => {
    if (name === 'username') setUsername(value);
    // if (name === 'password') setPassword(value);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
  };

  const onSubmitLogin = async (
    e: React.MouseEvent<HTMLButtonElement>,
    guest: boolean
  ) => {
    e.preventDefault();

    const userData: UserData = {
      username,
      password,
      guest,
    };

    let guestUserData: UserData | null = null;

    if (guest) {
      const existingGuestUser = getGuestUserFromLocalStorage();
      if (existingGuestUser) {
        guestUserData = {
          username: existingGuestUser.key,
          password: '123456',
          guest: true,
        };
      } else {
        guestUserData = {
          username: `guest_${Math.random().toString(36).substring(2)}`,
          password: '123456',
          guest: true,
        };
      }
    }

    try {
      const result = await dispatch<any>(
        loginUser(guest ? guestUserData : userData)
      );

      if (result.success) {
        setFadeOut(true);
        audioManager.playSFX('impact');
        setTimeout(() => {
          navigate('/');
        }, 500);
      } else {
        console.error('Login failed:', result.error);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
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
      className={`login-page ${fadeIn ? 'fade-in' : ''} ${
        fadeOut ? 'fade-out' : ''
      }`}
    >
      <div className={`fade-overlay ${fadeOut ? 'active' : ''}`} />
      <Hero />
      <form className="view" noValidate>
        <img className="logo" src={'/assets/logoall+.png'} alt="" />
        <div className="login-info">
          Create an account if you want to place on the leaderboard. Otherwise,
          click AS GUEST to enter anonymously.
        </div>
        <div></div>
        <div className="inputs">
          <div className="input-top">
            <div className="text-inputs">
              <Input
                className="login-input"
                color={'S'}
                // width={220}
                height={40}
                placeholder={'Username'}
                value={username}
                onChange={(value) => onChange('username', value)}
                styles={{ margin: '2px' }}
                password={false}
              />
              <Input
                className="login-input"
                color={'S'}
                // width={220}
                height={40}
                placeholder={'Password'}
                value={password}
                onChange={(value) => handlePasswordChange(value)}
                styles={{ margin: '2px' }}
                password={true}
              />
            </div>
            <div className="top-buttons">
              {/* <div style={{ height: '44px' }}></div> */}
              <Button
                text={'AS GUEST'}
                color={'O'}
                width={140}
                height={40}
                onClick={(e) => onSubmitLogin(e, true)}
                styles={{ margin: '2px' }}
                backgroundColorOverride="linear-gradient(135deg, rgba(255, 159, 28, 0.3), rgba(255, 46, 99, 0.3))"
              />
              <Button
                text={'LOGIN'}
                color={'S'}
                width={140}
                height={40}
                onClick={(e) => {
                  return onSubmitLogin(e, false);
                }}
                disabled={false}
                styles={{ margin: '2px' }}
              />
            </div>
          </div>
          <div className="mini-buttons">
            <Button
              className="tertiary"
              text={'REGISTER'}
              color={'S'}
              width={80}
              height={30}
              fontSize={12}
              onClick={() => handleEnterClick('/register')}
            />
            {/* <Link to="/">
              <Button
                className="tertiary"
                text={'FORGOT'}
                color={'S'}
                width={80}
                height={30}
                fontSize={12}
                backgroundColorOverride="#111111"
              />
            </Link> */}
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
          <div className="login-errors">
            {_.map(loginRegisterErrors, (value, i) => {
              return (
                <span className="login-error" key={i}>
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

// UnwrappedLogin.propTypes = {
//   loginUser: PropTypes.func.isRequired,
//   auth: PropTypes.object.isRequired,
//   errors: PropTypes.object.isRequired,
// };

export const Login = UnwrappedLogin;
