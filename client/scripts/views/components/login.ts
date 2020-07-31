import 'components/login.scss';

import m from 'mithril';
import $ from 'jquery';
import { Icon, Icons, Button, Input, Form, FormGroup, PopoverMenu, MenuDivider, MenuItem } from 'construct-ui';

import app from 'state';
import { ChainBase } from 'models';

const Login: m.Component<{}, {
  disabled: boolean;
  success: boolean;
  failure: boolean;
  error: Error | string;
}> = {
  view: (vnode) => {
    return m('.Login', {
      onclick: (e) => {
        e.stopPropagation();
      }
    }, [
      m(Form, { gutter: 10 }, [
        m(FormGroup, { span: 9 }, [
          m(Input, {
            fluid: true,
            name: 'email',
            placeholder: 'Email',
            autocomplete: 'off',
            onclick: (e) => {
              e.stopPropagation();
            },
            oncreate: (vvnode) => {
              $(vvnode.dom).focus();
            }
          }),
        ]),
        m(FormGroup, { span: 3 }, [
          m(Button, {
            intent: 'primary',
            fluid: true,
            disabled: vnode.state.disabled,
            type: 'submit',
            onclick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              const email = $(e.target).closest('.Login').find('[name="email"]').val().toString();
              const path = m.route.get();
              if (!email) return;
              vnode.state.disabled = true;
              vnode.state.success = false;
              vnode.state.failure = false;
              $.post(`${app.serverUrl()}/login`, { email, path }).then((response) => {
                vnode.state.disabled = false;
                if (response.status === 'Success') {
                  vnode.state.success = true;
                } else {
                  vnode.state.failure = true;
                  vnode.state.error = response.message;
                }
                m.redraw();
              }).catch((err: any) => {
                vnode.state.disabled = false;
                vnode.state.failure = true;
                vnode.state.error = (err && err.responseJSON && err.responseJSON.error) || err.statusText;
                m.redraw();
              });
            },
            label: 'Go',
            loading: vnode.state.disabled,
          }),
        ])
      ]),
      vnode.state.success && m('.login-message.success', [
        'Check your email to continue.'
      ]),
      vnode.state.failure && m('.login-message.failure', [
        vnode.state.error || 'An error occurred.'
      ]),

      m('.form-divider', 'or'),
      m(Form, { gutter: 10 }, [
        m(FormGroup, { span: 12 }, [
          m(Button, {
            intent: 'primary',
            fluid: true,
            href: `${app.serverUrl()}/auth/github`,
            onclick: (e) => {
              localStorage.setItem('githubPostAuthRedirect', JSON.stringify({
                timestamp: (+new Date()).toString(),
                path: m.route.get()
              }));
            },
            label: 'Continue with Github'
          }),
        ]),
      ]),
      m(Form, { gutter: 10 }, [
        m(FormGroup, { span: 12 }, [
          //
          m(Button, {
            intent: 'primary',
            fluid: true,
            class: 'login-with-web3',
            onclick: (e) => {
               e.preventDefault();
              $(e.target).trigger('menuclose');
              m.route.set('/web3login');
            },
            label: [
              `Continue with ${(app.chain && app.chain.chain && app.chain.chain.denom) || ''} wallet`,
              m(Icon, { name: Icons.CHEVRON_DOWN }),
            ],
          }),
        ]),
      ]),
    ]);
  },
};

export default Login;
