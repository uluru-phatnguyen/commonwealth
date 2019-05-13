const program = require('commander');
import dbModels from '../database';
import * as Sequelize from 'sequelize';
import { CLIENT_URL } from '../config';
import moment = require('moment');

const fetchProposalsSince = async (models, since: Date) => {
  const proposals = await models.Proposal.findAll({
    where: {
      created_at: {
        [Sequelize.Op.gte]: since
      }
    },
    include: [ ],
    order: [['created_at', 'DESC']],
  });
  return proposals;
};

const fetchThreadsSince = async (models, since: Date) => {
  const threads = await models.OffchainThread.findAll({
    where: {
      created_at: {
        [Sequelize.Op.gte]: since
      }
    },
    include: [ models.Address, models.OffchainThreadCategory ],
    order: [['created_at', 'DESC']],
  });
  return threads;
};

const fetchCommentsSince = async (models, since: Date) => {
  const comments = await models.Comment.findAll({
    where: {
      created_at: {
        [Sequelize.Op.gte]: since
      }
    },
    include: [ models.Address ],
    order: [['created_at', 'DESC']],
  });
  return comments;
};

interface IProposalData {
  url: string;
  type: string;
  created: moment.Moment;
  active: boolean;
}

const formatProposal = (p) => {
  //console.log(p);
  const data: IProposalData = {
    url: `${CLIENT_URL}/#!/proposal/${p.type}/${p.identifier}`,
    type: p.type,
    created: moment(p.created_at),
    active: !p.completed
  };
  return `PROPOSAL: ${data.url}\n` +
    `Type: ${data.type}\n` +
    `Created: ${data.created.calendar()}\n` +
    `Is Active: ${data.active}\n`;
};

interface IThreadData {
  url: string;
  category: string;
  title: string;
  body: string;
  created: moment.Moment;
  author: string;
}

const formatThread = (t) => {
  const data: IThreadData  = {
    url: `${CLIENT_URL}/#!/proposal/discussion/${t.id}`,
    category: t.OffchainThreadCategory.name,
    title: t.title,
    body: t.body,
    created: moment(t.created_at),
    author: t.Address.public_key,
  };
  return `THREAD: ${data.url}\n` +
    `Author: ${data.author}\n` +
    `Created: ${data.created.calendar()}\n` +
    `Title: ${data.title}\n` +
    `${data.body}\n`;
};

interface ICommentData {
  threadUrl: string;
  text: string;
  created: moment.Moment;
  author: string;
}

const formatComment = (c) => {
  const underscoreLocation = c.object_id.indexOf('_');
  const slug = c.object_id.slice(0, underscoreLocation);
  const identifier = c.object_id.slice(underscoreLocation + 1);
  const data: ICommentData = {
    threadUrl: `${CLIENT_URL}/#!/proposal/${slug}/${identifier}`,
    text: c.text,
    created: moment(c.created_at),
    author: c.Address.public_key,
  };
  return `COMMENT ON: ${data.threadUrl}\n` +
    `Author: ${data.author}\n` +
    `Created: ${data.created.calendar()}\n` +
    `${data.text}\n`;
};

program.version('0.0.1')
  .option('--dryrun', 'output digest to console')
  .option('--email <address>', 'output digest as email template')
  .option('--hourly', 'output digest for last hour')
  .option('--daily', 'output digest for last day')
  .option('--weekly', 'output digest for last week')
  .parse(process.argv);

if (!program.hourly && !program.daily && !program.weekly) {
  console.error('must provide a time range!');
  program.help();
  process.exit(1);
}

if (!program.email && !program.dryrun) {
  console.error('must specify either an email template or dry run');
  program.help();
  process.exit(1);
}

const HOUR = 1000 * 60 * 60;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const since: Date = program.hourly ? new Date(Date.now() - HOUR) :
  program.daily ? new Date(Date.now() - DAY) :
    new Date(Date.now() - WEEK);

Promise.all([
  fetchProposalsSince(dbModels, since),
  fetchThreadsSince(dbModels, since),
  fetchCommentsSince(dbModels, since)
])
.then(([proposals, threads, comments]) => {
  if (program.dryrun) {
    console.log(proposals.map(formatProposal).join('\n'));
    console.log(threads.map(formatThread).join('\n'));
    console.log(comments.map(formatComment).join('\n'));
  } else {
    // TODO: shove it into email template
  }
  process.exit(0);
})
.catch((err) => {
  console.error('Failed to create digest: ', err);
  process.exit(1);
});
