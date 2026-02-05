import { Octokit } from 'octokit'; //github
import React, { useEffect, useState } from 'react';
import { StatCard } from '@/app/types';

interface Stat1Props {
  stat: StatCard;
}   