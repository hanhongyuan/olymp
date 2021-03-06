import React from 'react';
import enUS from 'antd/lib/locale-provider/en_US';
import LocaleProvider from 'antd/lib/locale-provider';
import moment from 'moment';
import 'moment/locale/de';
moment.locale('de');

export const withLocale = WrappedComponent => props => (
  <LocaleProvider locale={enUS}>
    <WrappedComponent {...props} />
  </LocaleProvider>
);

export default props => (
  <LocaleProvider locale={enUS}>
    {props.children}
  </LocaleProvider>
);
