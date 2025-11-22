import React from 'react';
import Modal from 'react-modal';
// import { Link } from 'react-router-dom';
import Button from 'src/shared/components/Button/Button';

interface DashboardModalProps {}
interface DashboardModalState {
  isVisible: boolean;
}

export default class DashboardModal extends React.Component<
  DashboardModalProps,
  DashboardModalState
> {
  private readonly version = '4.0.0';

  constructor(props: DashboardModalProps) {
    super(props);

    const storedVersion = localStorage.getItem('dashboardModalVersion');
    const shouldShowModal =
      storedVersion === null || storedVersion !== this.version;

    this.state = {
      isVisible: shouldShowModal,
    };
  }

  closeModal = () => {
    localStorage.setItem('dashboardModalVersion', this.version);
    this.setState({ isVisible: false });
  };

  render() {
    return (
      <Modal
        isOpen={this.state.isVisible && this.state.isVisible}
        onRequestClose={this.closeModal}
        style={dashboardModal}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
            padding: '20px',
            boxSizing: 'border-box',
            overflow: 'auto',
          }}
        >
          <p>
            Hello, meda here. Thank you for visiting the site. If you are a
            first-time visitor, I recommend starting with Quickplay to explore
            exciting new ways to enjoy the game, or check out the Manifest for a
            deeper dive into what this site is about. A note that mobile
            development has basically been met, but the site is best experienced
            from a desktop device.
          </p>{' '}
          <br />{' '}
          {/* <p>
            {' '}
            While this site is a showcase of the story, lessons, and variants,
            it is also a thought experiment. Most engines traditionally give the
            white pieces a 0.3-point starting advantage over black. With the
            introduction of conditional spells, the aim is to seek out a
            perfectly balanced start to the game but also introduce a layer of
            strategic unpredictability.{' '}
          </p>{' '}
          <br />{' '} */}
          <p>
            This site is a work in progress, and we genuinely value your
            suggestions and constructive feedback! While the manifest includes
            some known bugs, we’re actively working to improve. Be part of the
            journey—join our community on Discord to share your thoughts or
            connect with other players.
          </p>
          <div
            style={{
              width: '100%',
              height: '120px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '40px 0 0 0',
            }}
          >
            <Button
              text="CLOSE"
              color="S"
              className="primary"
              onClick={() => this.closeModal()}
            />
          </div>
        </div>
      </Modal>
    );
  }
}

const dashboardModal = {
  content: {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: '420px',
    maxHeight: '90vh',
    width: '90vw',
    maxWidth: '600px',
    background: '#000000',
    borderRadius: '10px',
    border: 'none',
    overflowY: 'auto' as const,
    boxSizing: 'border-box' as const,
  },
  overlay: {
    zIndex: 10,
    backgroundColor: '#111111AA',
  },
};
