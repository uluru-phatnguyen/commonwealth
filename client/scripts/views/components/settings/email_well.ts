
import 'components/settings/email_well.scss';
import 'components/settings/github_well.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';

import { DropdownFormField, RadioSelectorFormField } from 'views/components/forms';
import { notifySuccess } from 'controllers/app/notifications';
import SettingsController from 'controllers/app/settings';
import { SocialAccount } from 'models';
import { Button, Input, Icons, Icon, Tooltip } from 'construct-ui';

interface IState {
  email: string;
  emailVerified: boolean;
  githubAccount: SocialAccount;
}

interface IAttrs {
  github?: boolean;
}

const EmailWell: m.Component<IAttrs, IState> = {
  oninit: (vnode) => {
    vnode.state.email = app.login.email;
    vnode.state.emailVerified = app.login.emailVerified;
    vnode.state.githubAccount = app.login.socialAccounts.find((sa) => sa.provider === 'github');
  },
  view: (vnode) => {
    const { githubAccount, email, emailVerified } = vnode.state;
    return [
      m('.EmailWell', [
        m('h4', 'Email'),
        m(Input, {
          contentLeft: m(Icon, { name: Icons.MAIL }),
          defaultValue: email || null,
          onkeyup: (e) => { vnode.state.email = (e.target as any).value; },
        }),
        m(Button, {
          label: 'Update Email',
          onclick: async () => {
            try {
              if (email === app.login.email) return;
              const response = await $.post(`${app.serverUrl()}/updateEmail`, {
                'email': email,
                'jwt': app.login.jwt,
              });
              app.login.email = response.result.email;
              vnode.state.emailVerified = false;
              m.redraw();
            } catch (err) {
              console.log('Failed to update email');
              throw new Error((err.responseJSON && err.responseJSON.error)
                ? err.responseJSON.error
                : 'Failed to update email');
            }
          }
        }),
        m(Tooltip, {
          content: emailVerified ? 'Email verified' : 'Email not verified',
          position: 'top',
          transitionDuration: 0,
          trigger: m(Icon, {
            size: 'lg',
            name: emailVerified ? Icons.CHECK_CIRCLE : Icons.X_CIRCLE,
          }),
        }),
      ]),
      vnode.attrs.github && m('.GithubWell', [
        m('form', [
          // m('h4', 'Github'),
          m(Input, {
            value: githubAccount?.username || '',
            contentLeft: m(Icon, { name: Icons.GITHUB }),
            disabled: true,
          }),
          m(Button, {
            label: githubAccount ? 'Unlink Github' : 'Link Github',
            href: githubAccount ? '' : `${app.serverUrl()}/auth/github`,
            intent: githubAccount ? 'negative' : 'none',
            onclick: () => {
              if (githubAccount) {
                $.ajax({
                  url: `${app.serverUrl()}/githubAccount`,
                  data: { jwt: app.login.jwt },
                  type: 'DELETE',
                  success: (result) => {
                    vnode.state.githubAccount = null;
                    m.redraw();
                  },
                  error: (err) => {
                    console.dir(err);
                    m.redraw();
                  },
                });
              } else {
                localStorage.setItem('githubPostAuthRedirect', JSON.stringify({
                  timestamp: (+new Date()).toString(),
                  path: m.route.get()
                }));
                m.redraw();
              }
            },
          })
        ]),
      ])
    ];
  },
};

export default EmailWell;
