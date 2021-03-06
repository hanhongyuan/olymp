import React, { Component } from 'react';
import { Modal } from 'antd';
import { cloudinaryUrl } from 'olymp';

const defaultGetImage = props => props.value;
export default ({ getImage } = {}) => WrappedComponent => class Lightbox extends Component {
  id = Math.random().toString(36).substr(2, 9);
  static contextTypes = {
    lightbox: React.PropTypes.object,
  }
  setImage(props) {
    const image = (getImage || defaultGetImage)(props);
    if (image) this.context.lightbox.add(this.id, image);
  }
  componentWillMount() {
    this.setImage(this.props);
  }
  componentWillReceiveProps(props) {
    this.setImage(props);
  }
  componentWillUnmount() {
    this.context.lightbox.remove(this.id);
  }
  render() {
    if (this.props.lightbox !== true) {
      return <WrappedComponent {...this.props} />;
    }
    const { children } = this.props;
    return (
      <WrappedComponent {...this.props} showLightbox={() => this.context.lightbox.show(this.id)}>
        {children}
      </WrappedComponent>
    );
  }
};

export const useLightboxes = WrappedComponent => class WithLightbox extends Component {
  lightboxes = {};
  state = { visible: false };
  static childContextTypes = {
    lightbox: React.PropTypes.object,
  }

  getChildContext() {
    return {
      lightbox: {
        add: this.add,
        remove: this.remove,
        show: this.show,
        hide: this.hide,
      },
    };
  }

  componentWillUpdate(props, state) {
    if (state.visible !== false && this.state.visible === false) {
      document.addEventListener('keydown', this.onKeyDown);
    } else if (state.visible === false && this.state.visible !== false) {
      document.removeEventListener('keydown', this.onKeyDown);
    }
  }
  onKeyDown = e => {
    const { visible } = this.state;
    const images = Object.keys(this.lightboxes).map(key => this.lightboxes[key]);
    if (e.keyCode === 37) {
      this.setState({ visible: (visible + images.length - 1) % images.length });
    } else if (e.keyCode === 39) {
      this.setState({ visible: (visible + 1) % images.length });
    }
  }

  add = (ref, image) => {
    this.lightboxes[ref] = image;
  }
  remove = (ref) => {
    delete this.lightboxes[ref];
  }
  show = (ref) => {
    const images = Object.keys(this.lightboxes).map(key => this.lightboxes[key]);
    this.setState({ visible: images.indexOf(this.lightboxes[ref]) });
  };
  hide = () => {
    this.setState({ visible: false });
  };

  render() {
    const { visible } = this.state;
    const { children } = this.props;
    const images = Object.keys(this.lightboxes).map(key => this.lightboxes[key]);
    return (
      <WrappedComponent {...this.props}>
        {children}
        {visible !== false ? <Modal
          visible
          width="100xd"
          className="athena-lightbox"
          footer={false}
          mainSrc={images[visible].url}
          imageTitle={images[visible].caption}
          nextSrc={images[(visible + 1) % images.length]}
          prevSrc={images[(visible + images.length - 1) % images.length]}
          onCancel={this.hide}
        ><img src={cloudinaryUrl(images[visible].url)} width="100%" height="auto" /></Modal> : null}
      </WrappedComponent>
    );

    return (
      <WrappedComponent {...this.props}>
        {children}
        {visible !== false ? <Modal
          wrapClassName="lala"
          style={{ color: 'red' }}
          mainSrc={images[visible].url}
          imageTitle={images[visible].caption}
          nextSrc={images[(visible + 1) % images.length]}
          prevSrc={images[(visible + images.length - 1) % images.length]}
          onClose={this.hide}
          enableZoom={false}
          discourageDownloads
          onMovePrevRequest={() => this.setState({ visible: (visible + images.length - 1) % images.length })}
          onMoveNextRequest={() => this.setState({ visible: (visible + 1) % images.length })}
        /> : null}
      </WrappedComponent>
    );
  }
};

