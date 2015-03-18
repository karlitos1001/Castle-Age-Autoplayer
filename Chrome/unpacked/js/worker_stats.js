
/*jslint white: true, browser: true, devel: true, undef: true,
nomen: true, bitwise: true, plusplus: true,
regexp: true, eqeq: true, newcap: true, forin: false */
/*global window,escape,jQuery,$j,rison,utility,offline,town,gm,
$u,chrome,CAAP_SCOPE_RUN,self,caap,config,con,spreadsheet,ss,
schedule,gifting,state,army, general,session,monster,guild_monster */
/*jslint maxlen: 256 */

    /////////////////////////////////////////////////////////////////////
    //                          GET STATS
    // Functions that records all of base game stats, energy, stamina, etc.
    /////////////////////////////////////////////////////////////////////

(function() {
    "use strict";

	worker.add({name: 'statsFunc', recordIndex: 'FBID', recordsAreObj: true});

    statsFunc.record = function (FBID) {
        this.data = {
			FBID: FBID,
			account: '',
			PlayerName: '',
			level: 0,
			army: {
				actual: 0,
				capped: 0
			},
			records: {
				total: 0,
				invade: 0
			},
			attack: 0,
			defense: 0,
			bonus: {
				attack: 0,
				defense: 0,
				dpi: 0,
				api: 0
			},
			points: {
				skill: 0,
				favor: 0,
				guild: 0
			},
			indicators: {
				bsi: 0,
				lsi: 0,
				sppl: 0,
				api: 0,
				dpi: 0,
				mpi: 0,
				mhbeq: 0,
				htl: 0,
				hrtl: 0,
				enl: 0,
				pvpclass: '',
				build: ''
			},
			gold: {
				cash: 0,
				bank: 0,
				total: 0,
				income: 0,
				upkeep: 0,
				flow: 0,
				ticker: []
			},
			rank: {
				battle: 0,
				battlePoints: 0,
				war: 0,
				warPoints: 0,
				conquest: 0,
				conquestPoints: 0,
				conquestLevel: 0,
				conquestLevelPercent: 0
			},
			potions: {
				energy: 0,
				stamina: 0
			},
			energy: {
				norm: 0,
				num: 0,
				min: 0,
				max: 0,
				ticker: []
			},
			health: {
				norm: 0,
				num: 0,
				min: 0,
				max: 0,
				ticker: []
			},
			stamina: {
				norm: 0,
				num: 0,
				min: 0,
				max: 0,
				ticker: []
			},
			lowpoints: {
				level: 0,
				stamina: 0,
				energy: 0
			},
			exp: {
				num: 0,
				max: 0,
				dif: 0
			},
			guildTokens: {
				num: 0,
				max: 0,
				dif: 0
			},
			resources: {
				lumber: 0,
				iron: 0
			},
			conquest: {
				Conqueror: 0,
				Guardian: 0,
				Hunter: 0,
				Engineer: 0
			},
			LoMland: -1,
			other: {
				qc: 0,
				bww: 0,
				bwl: 0,
				te: 0,
				tee: 0,
				wlr: 0,
				eer: 0,
				atlantis: false
			},
			achievements: {
				battle: {
					invasions: {
						won: 0,
						lost: 0,
						streak: 0,
						ratio: 0
					},
					duels: {
						won: 0,
						lost: 0,
						streak: 0,
						ratio: 0
					}
				},
				monster: {},
				other: {
					alchemy: 0
				},
				feats: {
					attack: 0,
					defense: 0,
					health: 0,
					energy: 0,
					stamina: 0,
					army: 0
				}
			},
			character: {},
			guild: {
				name: '',
				id: '',
				ids: [], // For your guild mates
				level: 0,
				levelPercent: 0,
				mPoints: 0,
				mRank: '',
				bPoints: 0,
				bRank: '',
				powers: '',
				members: []
			},
			battleIdle: 'Use Current',
			reviewPages : [],
			rune: {
				attack: 0,
				defense: 0,
				damage: 0,
				health: 0
			},
			essence: {
				attack: 0,
				defense: 0,
				damage: 0,
				health: 0
			},
			priorityGeneral: 'Use Current'
		};
    };

	statsFunc.init = function() {
		try {
			var accountName = stats.account;
			stats = statsFunc.getRecord(stats.FBID);
			stats.account = accountName;
			
			session.setItem("UserDashUpdate", true);
       } catch (err) {
            con.error("ERROR in gb.init: " + err.stack);
            return false;
        }
	};
	
	statsFunc.check = function(page) {
        try {
            var passed = true,
                tNum = 0,
                xS = 0,
                xE = 0,
                max = 0,
                statDiv = $j("#globalContainer #main_sts_container"),
				tempDiv = $j(),
                text = statDiv.text().trim().innerTrim(),
                topText = $j('#globalContainer #main_bntp').text().trim().innerTrim();

			if (!$u.hasContent(text) || !$u.hasContent(topText)) {
				return false;
			}
			
            // gold
            stats.gold.cash = $u.setContent(text.regex(/to bank ([\d,]+) gold/), 0).numberOnly();

            ['energy','stamina','health'].forEach(function(stat) {
				tNum = stats[stat].max;
                if (caap.getStatusNumbers(text.regex(new RegExp(stat.ucWords() + '(?: \\+\\d\\:\\d+)? (\\d+\\/\\d+)')), stats[stat])) {
					if (stats[stat].max != tNum) {
						tempDiv = $j($j("#" + stat + "_current_value", statDiv)[0].parentNode);
						if ($u.hasContent(tempDiv) && tempDiv.html().indexOf('color') == -1) {
								stats[stat].norm = stats[stat].max;
						}
					}
				} else {
                    con.warn("Unable to get stat " + stat);
                    passed = false;
                }
            });

            // experience
            if (!caap.bulkRegex(text, /XP: (\d+)\/(\d+) XP needed: (\d+)/,
				stats.exp, ['num', 'max', 'dif'])) {
                con.warn("Unable to get experience numbers");
                passed = false;
            }

            // level
            tNum = text.regex(/Level: (\d+)/)
            if (tNum) {
                if (tNum > stats.level) {
                    con.log(2, 'New level. Resetting Best Land Cost.');
                    caap.bestLand = state.setItem('BestLandCost', new caap.landRecord().data);
                    state.setItem('KeepLevelUpGeneral', true);
                }

                stats.level = tNum;
            } else {
                con.warn("Unable to get level");
                passed = false;
            }

            // army
            tNum = topText.regex(/Army \((\d+)\)/)
            if (tNum) {
                stats.army.actual = tNum;
                tNum = Math.min(stats.army.actual, 501);
                if (tNum >= 1 && tNum <= 501) {
                    stats.army.capped = tNum;
                } else {
                    con.warn("Army count not in limits");
                    passed = false;
                }
            } else {
                con.warn("Unable to get army numbers");
                passed = false;
            }

            // upgrade points  My Stats (+5) 
            tNum = topText.regex(/My Stats \(\+(\d+)\)/)
            if (tNum) {
                if (tNum > stats.points.skill) {
                    con.log(2, 'New points. Resetting AutoStat.');
                    state.setItem("statsMatch", true);
                }

                stats.points.skill = tNum;
            }

            // Indicators: Hours To Level, Time Remaining To Level and Expected Next Level
            if (stats.exp) {
                xS = gm ? gm.getItem("expStaminaRatio", 2.4, hiddenVar) : 2.4;
                xE = state.getItem('AutoQuest', caap.newAutoQuest()).expRatio || (gm ? gm.getItem("expEnergyRatio", 1.4, hiddenVar) : 1.4);
                stats.indicators.htl = ((stats.level * 12.5) - (stats.stamina.max * xS) - (stats.energy.max * xE)) / (24 * (xS + xE));
                stats.indicators.hrtl = (stats.exp.dif - (stats.stamina.num * xS) - (stats.energy.num * xE)) / (24 * (xS + xE));
                stats.indicators.enl = Date.now() + Math.ceil(stats.indicators.hrtl * 3600000);
            } else {
                con.warn('Could not calculate time to next level. Missing experience stats!');
                passed = false;
            }
			
			if (caap.oneMinuteUpdate('saveStats')) {
				statsFunc.setRecord(stats);
			}

            if (!passed && stats.energy.max === 0 && stats.health.max === 0 && stats.stamina.max === 0) {
                $j().alert("<div style='text-align: center;'>" + con.warn("Paused as this account may have been disabled!", stats) + "</div>");
                caap.pauseListener();
            }

            return passed;
        } catch (err) {
            con.error("ERROR in stats.check: " + err.stack);
            return false;
        }
    };

    stats.checkResults = function (page) {
        try {
			switch (page) {
			case 'keep' :
				var attrDiv = $j("#app_body #keepAltStats"),
					statsTB = $j("#app_body div[style*='keep_cont_treasure.jpg'] div:nth-child(3)>div>div>div>div"),
					//keepTable1 = $j("#app_body .keepTable1 tr"),
					statCont = $j("#app_body div[style*='keep_bgv2.jpg']>div>div>div"),
					recordsTxt = $j(),
					args = [],
					backgroundDiv = $j(),
					tempDiv = $j(),
					temp,
					row,
					head,
					body;

				if ($u.hasContent(attrDiv)) {
					con.log(2, "Getting new values from player keep");
					// rank
					tempDiv = $j("#app_body img[src*='gif/rank']");
					if ($u.hasContent(tempDiv)) {
						stats.rank.battle = $u.setContent($u.setContent(tempDiv.attr("src"), '').basename().regex(/(\d+)/), 0);
					} else {
						con.warn('Using stored rank.');
					}

					// PlayerName
					tempDiv = $j("#app_body div[style*='keep_top.jpg'] div").first();
					if ($u.hasContent(tempDiv)) {
						stats.PlayerName = tempDiv.text().trim();
						//con.log(1, stats.PlayerName);
					} else {
						con.warn('Using stored PlayerName.');
					}

					// FBID
					tempDiv = $j("#app_body a[href*='keep.php?user=']");
					if ($u.hasContent(tempDiv)) {
						stats.FBID = tempDiv.attr("href").basename().regex(/(\d+)/);
						//con.log(1, stats.FBID);
					} else {
						con.warn('Using stored PlayerName.');
					}

					// war rank
					if (stats.level >= 100) {
						tempDiv = $j("#app_body img[src*='war_rank_']");
						if ($u.hasContent(tempDiv)) {
							stats.rank.war = $u.setContent($u.setContent(tempDiv.attr("src"), '').basename().regex(/(\d+)/), 0);
						} else {
							con.warn('Using stored warRank.');
						}
					}
					// conquest rank
					if (stats.level >= 100) {
						tempDiv = $j("#app_body img[src*='conquest_rank_']");
						if ($u.hasContent(tempDiv)) {
							stats.rank.conquest = $u.setContent($u.setContent(tempDiv.attr("src"), '').basename().regex(/(\d+)/), 0);
						} else {
							con.warn('Using stored conquestRank.');
						}
					}

					if ($u.hasContent(statCont) && statCont.length >= 6) {
						if (stats.level >= 10) {
							// Attack
							tempDiv = statCont.eq(2);
							if ($u.hasContent(tempDiv)) {
								stats.attack = $u.setContent($u.setContent(tempDiv.text(), '').regex(/(\d+)/), 0);
								stats.bonus.attack = $u.setContent($u.setContent(tempDiv.text(), '').regex(/\(\+(\d+)\)/), 0);
								//con.log(2,'KEEP Attack', stats.attack, stats.attackbonus);
							} else {
								con.warn('Using stored attack value.');
							}

							// Defense
							tempDiv = statCont.eq(3);
							if ($u.hasContent(tempDiv)) {
								stats.defense = $u.setContent($u.setContent(tempDiv.text(), '').regex(/(\d+)/), 0);
								stats.bonus.defense = $u.setContent($u.setContent(tempDiv.text(), '').regex(/\(\+(\d+)\)/), 0);
								//con.log(2,'KEEP Defense', stats.defense, stats.defensebonus);
							} else {
								con.warn('Using stored defense value.');
							}
						}

						// Health
						tempDiv = statCont.eq(4);
						if ($u.hasContent(tempDiv)) {
							stats.health.norm = $u.setContent($u.setContent(tempDiv.text(), '').regex(/(\d+)/), 0);
							
						} else {
							con.warn('Unable to find unadjusted Health value.');
						}
						
						// Energy
						tempDiv = statCont.eq(0);
						if ($u.hasContent(tempDiv)) {
							stats.energy.norm = $u.setContent($u.setContent(tempDiv.text(), '').regex(/(\d+)/), 0);
						} else {
							con.warn('Unable to find unadjusted Energy value.');
						}

						// Stamina
						tempDiv = statCont.eq(1);
						if ($u.hasContent(tempDiv)) {
							stats.stamina.norm = $u.setContent($u.setContent(tempDiv.text(), '').regex(/(\d+)/), 0);
						} else {
							con.warn('Unable to find unadjusted Stamina value.');
						}
					} else {
						con.warn("Can't find stats containers! Using stored stats values.");
					}

					// Check for Gold Stored
					tempDiv = statsTB.eq(4);
					if ($u.hasContent(tempDiv)) {
						stats.gold.bank = $u.setContent($u.setContent(tempDiv.text(), '').numberOnly(), 0);
						stats.gold.total = stats.gold.bank + stats.gold.cash;
						tempDiv.attr({
							title: "Click to copy value to retrieve"
						}).css({
							color: "blue",
							cursor: "pointer"
						}).on("click", function () {
							$j("#app_body #getGold").val(stats.gold.bank);
						});
					} else {
						con.warn('Using stored inStore.');
					}

					// Check for income
					tempDiv = statsTB.eq(5);
					if ($u.hasContent(tempDiv)) {
						stats.gold.income = $u.setContent($u.setContent(tempDiv.text(), '').numberOnly(), 0);
					} else {
						con.warn('Using stored income.');
					}

					// Check for upkeep
					tempDiv = statsTB.eq(6);
					if ($u.hasContent(tempDiv)) {
						stats.gold.upkeep = $u.setContent($u.setContent(tempDiv.text(), '').numberOnly(), 0);
					} else {
						con.warn('Using stored upkeep.');
					}

					// Cash Flow
					stats.gold.flow = stats.gold.income - stats.gold.upkeep;

					// Energy potions
					tempDiv = $j("div[title='Energy Potion']").children().eq(1);
					if ($u.hasContent(tempDiv)) {
						stats.potions.energy = $u.setContent($u.setContent(tempDiv.text(), '').numberOnly(), 0);
					} else {
						stats.potions.energy = 0;
					}

					// Stamina potions
					tempDiv = $j("div[title='Stamina Potion']").children().eq(1);
					if ($u.hasContent(tempDiv)) {
						stats.potions.stamina = $u.setContent($u.setContent(tempDiv.text(), '').numberOnly(), 0);
					} else {
						stats.potions.stamina = 0;
					}

					// Other stats
					// Atlantis Open
					stats.other.atlantis = $u.hasContent(caap.checkForImage("seamonster_map_finished.jpg")) ? true : false;

					recordsTxt = $u.setContent($j("#globalContainer #records_tab").text().trim().innerTrim(), '');
					args = recordsTxt.match(new RegExp("Quests Completed (\\d+) Battles/Wars Won (\\d+) Battles/Wars Lost (\\d+) Kills (\\d+) Deaths (\\d+)"));
					if (args && args.length === 6) {
						stats.other.qc = args[1].numberOnly();
						stats.other.bww = args[2].numberOnly();
						stats.other.bwl = args[3].numberOnly();
						stats.other.te = args[4].numberOnly();
						stats.other.tee = args[5].numberOnly();
						//con.log(2, "my stats", args, recordsTxt, stats.other);
					} else {
						con.warn("Unable to read quests completed and battle stats", args, recordsTxt);
					}

					// Win/Loss Ratio (WLR)
					stats.other.wlr = stats.other.bwl !== 0 ? (stats.other.bww / stats.other.bwl).dp(2) : Infinity;
					// Enemy Eliminated Ratio/Eliminated (EER)
					stats.other.eer = stats.other.tee !== 0 ? (stats.other.tee / stats.other.te).dp(2) : Infinity;
					// Indicators
					if (stats.level >= 10) {
						stats.indicators.bsi = ((stats.attack + stats.defense) / stats.level).dp(2);
						stats.indicators.lsi = ((stats.energy.max + (2 * stats.stamina.max)) / stats.level).dp(2);
						stats.indicators.sppl = ((stats.energy.max + (2 * stats.stamina.max) + stats.attack + stats.defense + stats.health.max - 122) / stats.level).dp(2);
						stats.indicators.api = (stats.attack + (stats.defense * 0.7)).dp(0);
						stats.bonus.api = stats.indicators.api + (stats.bonus.attack + (stats.bonus.defense * 0.7)).dp(0);
						stats.indicators.dpi = ((stats.defense + (stats.attack * 0.7))).dp(0);
						stats.bonus.dpi = stats.indicators.dpi + (stats.bonus.defense + (stats.bonus.attack * 0.7)).dp(0);
						stats.indicators.mpi = (((stats.indicators.api + stats.indicators.dpi) / 2)).dp(0);
						stats.indicators.mhbeq = ((stats.attack + (2 * stats.stamina.max)) / stats.level).dp(2);
						if (stats.attack >= stats.defense) {
							temp = stats.attack / stats.defense;
							if (temp === stats.attack) {
								stats.indicators.pvpclass = 'Destroyer';
							} else if (temp >= 2 && temp < 7.5) {
								stats.indicators.pvpclass = 'Aggressor';
							} else if (temp < 2 && temp > 1.01) {
								stats.indicators.pvpclass = 'Offensive';
							} else if (temp <= 1.01) {
								stats.indicators.pvpclass = 'Balanced';
							}
						} else {
							temp = stats.defense / stats.attack;
							if (temp === stats.defense) {
								stats.indicators.pvpclass = 'Wall';
							} else if (temp >= 2 && temp < 7.5) {
								stats.indicators.pvpclass = 'Paladin';
							} else if (temp < 2 && temp > 1.01) {
								stats.indicators.pvpclass = 'Defensive';
							} else if (temp <= 1.01) {
								stats.indicators.pvpclass = 'Balanced';
							}
						}
					}

					// added rune totals
					temp = $j('#runes_2').text().trim().innerTrim();
					caap.bulkRegex(temp, / (\d+).*Atk.* (\d+).*Def.* (\d+).*Dmg.* (\d+).*Hth/, stats.rune, ['attack', 'defense', 'damage', 'health']);
					caap.bulkRegex(temp, /x(\d+) x(\d+) x(\d+) x(\d+)/, stats.essence, ['Attack', 'Defense', 'Damage', 'Health']);

					statsFunc.setRecord(stats);
					if (config.getItem("displayKStats", true)) {
						tempDiv = $j("div[style*='keep_top']");
						backgroundDiv = $j("div[style*='keep_tabheader']");

						temp = "<div style='background-image:url(\"" + caap.domain.protocol[caap.domain.ptype] +"castleagegame1-a.akamaihd.net/30966/graphics/keep_tabsubheader_mid.jpg\");border:none;padding: 5px 5px 20px 20px;width:715px;font-weight:bold;font-family:Verdana;sans-serif;background-repeat:y-repeat;'>";
						temp += "<div style='border:1px solid #701919;padding: 5px 5px;width:688px;height:100px;background-color:#d0b682;'>";
						row = caap.makeTh({
							text: '&nbsp;',
							color: '',
							bgcolor: '',
							id: '',
							title: '',
							width: '5%'
						});

						row += caap.makeTh({
							text: '&nbsp;',
							color: '',
							bgcolor: '',
							id: '',
							title: '',
							width: '10%'
						});

						row += caap.makeTh({
							text: '&nbsp;',
							color: '',
							bgcolor: '',
							id: '',
							title: '',
							width: '20%'
						});

						row += caap.makeTh({
							text: '&nbsp;',
							color: '',
							bgcolor: '',
							id: '',
							title: '',
							width: '10%'
						});

						row += caap.makeTh({
							text: '&nbsp;',
							color: '',
							bgcolor: '',
							id: '',
							title: '',
							width: '20%'
						});

						row += caap.makeTh({
							text: '&nbsp;',
							color: '',
							bgcolor: '',
							id: '',
							title: '',
							width: '10%'
						});

						row += caap.makeTh({
							text: '&nbsp;',
							color: '',
							bgcolor: '',
							id: '',
							title: '',
							width: '20%'
						});

						row += caap.makeTh({
							text: '&nbsp;',
							color: '',
							bgcolor: '',
							id: '',
							title: '',
							width: '5%'
						});

						head = caap.makeTr(row);

						row = caap.makeTd({
							text: '',
							color: '',
							id: '',
							title: ''
						});

						row += caap.makeTd({
							text: 'BSI',
							color: '',
							id: '',
							title: 'Battle Strength Index'
						}, "font-size:14px;");

						row += caap.makeTd({
							text: stats.indicators.bsi,
							color: '',
							id: '',
							title: ''
						}, "font-size:14px;");

						row += caap.makeTd({
							text: 'LSI',
							color: '',
							id: '',
							title: 'Leveling Speed Index'
						}, "font-size:14px;");

						row += caap.makeTd({
							text: stats.indicators.lsi,
							color: '',
							id: '',
							title: ''
						}, "font-size:14px;");

						row += caap.makeTd({
							text: 'SPPL',
							color: '',
							id: '',
							title: 'Skill Points Per Level (More accurate than SPAEQ)'
						}, "font-size:14px;");

						row += caap.makeTd({
							text: stats.indicators.sppl,
							color: '',
							id: '',
							title: ''
						}, "font-size:14px;");

						body = caap.makeTr(row);

						row = caap.makeTd({
							text: '',
							color: '',
							id: '',
							title: ''
						});

						row += caap.makeTd({
							text: 'API',
							color: '',
							id: '',
							title: 'Attack Power Index'
						}, "font-size:14px;");

						row += caap.makeTd({
							text: stats.indicators.api,
							color: '',
							id: '',
							title: ''
						}, "font-size:14px;");

						row += caap.makeTd({
							text: 'DPI',
							color: '',
							id: '',
							title: 'Defense Power Index'
						}, "font-size:14px;");

						row += caap.makeTd({
							text: stats.indicators.dpi,
							color: '',
							id: '',
							title: ''
						}, "font-size:14px;");

						row += caap.makeTd({
							text: 'MPI',
							color: '',
							id: '',
							title: 'Mean Power Index'
						}, "font-size:14px;");

						row += caap.makeTd({
							text: stats.indicators.mpi,
							color: '',
							id: '',
							title: ''
						}, "font-size:14px;");

						body += caap.makeTr(row);

						row = caap.makeTd({
							text: '',
							color: '',
							id: '',
							title: ''
						});

						row += caap.makeTd({
							text: 'MHBEQ',
							color: '',
							id: '',
							title: 'Monster Hunting Build Effective Quotent'
						}, "font-size:14px;");

						row += caap.makeTd({
							text: stats.indicators.mhbeq,
							color: '',
							id: '',
							title: ''
						}, "font-size:14px;");

						row += caap.makeTd({
							text: 'Build',
							color: '',
							id: '',
							title: 'Character build type'
						}, "font-size:14px;");

						row += caap.makeTd({
							text: stats.indicators.build,
							color: '',
							id: '',
							title: ''
						}, "font-size:14px;");

						row += caap.makeTd({
							text: 'PvP Class',
							color: '',
							id: '',
							title: 'Player vs. Player character class'
						}, "font-size:14px;");

						row += caap.makeTd({
							text: stats.indicators.pvpclass,
							color: '',
							id: '',
							title: ''
						}, "font-size:14px;");

						body += caap.makeTr(row);

						temp += caap.makeTable("keepstats", head, body, "Statistics", "font-size:16px;");
						temp += "</div></div>";
						tempDiv.after(temp);
					} else {
						tempDiv = $j(".keep_stat_title_inc", attrDiv);
						tempDiv = $u.hasContent(tempDiv) ? tempDiv.html($u.setContent(tempDiv.html(), '').trim() + ", <span style='white-space: nowrap;'>BSI: " +
							stats.indicators.bsi + " LSI: " + stats.indicators.lsi + "</span>") : tempDiv;
					}
				} else {
					tempDiv = $j("#app_body a[href*='keep.php?user=']");
					if ($u.hasContent(tempDiv)) {
						con.log(2, "On another player's keep", $u.setContent($u.setContent(tempDiv.attr("href"), '').basename().regex(/(\d+)/), 0));
					} else {
						con.warn("Attribute section not found and not identified as another player's keep!");
					}
				}
				break;
			default :
				break;
			}

            return true;
        } catch (err) {
            con.error("ERROR in stats.checkResults: " + err.stack);
            return false;
        }
    };
	
    statsFunc.dashboard = function() {
        try {
            var headers = [],
                values = [],
                pp = 0,
                i = 0,
                count = 0,
                userIdLink = '',
                userIdLinkInstructions = '',
                valueCol = 'red',
                len = 0,
                data = {
                    text: '',
                    color: '',
                    bgcolor: '',
                    id: '',
                    title: ''
                },
                handler = null,
                head = '',
                body = '',
                row = '',
                rows = [];

            /*-------------------------------------------------------------------------------------\
            Next we build the HTML to be included into the 'caap_userStats' div. We set our
            table and then build the header row.
            \-------------------------------------------------------------------------------------*/
            if (config.getItem('DBDisplay', '') === 'User Stats' && session.getItem("UserDashUpdate", true)) {
                head = "";
                body = "";
                headers = ['Name', 'Value', 'Name', 'Value'];
                for (pp = 0, len = headers.length; pp < len; pp += 1) {
                    head += caap.makeTh({
                        text: headers[pp],
                        width: ''
                    });
                }

                head = caap.makeTr(head);
                rows = [
                    [{
                        text: 'Facebook ID'
                    }, {
                        text: stats.FBID
                    }, {
                        text: 'Account Name'
                    }, {
                        text: caap.fbData.me.name
                    }, {
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;'
                    }],
                    [{
                        text: 'Character Name'
                    }, {
                        text: stats.PlayerName
                    }, {
                        text: 'Energy',
                        title: 'Current/Max'
                    }, {
                        text: stats.energy.num + '/' + stats.energy.max,
                        color: valueCol
                    }],
                    [{
                        text: 'Level'
                    }, {
                        text: stats.level,
                        color: valueCol
                    }, {
                        text: 'Stamina',
                        title: 'Current/Max'
                    }, {
                        text: stats.stamina.num + '/' + stats.stamina.max,
                        color: valueCol
                    }],
                    [{
                        text: 'Battle Rank'
                    }, {
                        text: battle.ranks.rank[stats.rank.battle] + ' (' + stats.rank.battle + ')',
                        color: valueCol
                    }, {
                        text: 'Attack',
                        title: 'Current/Max'
                    }, {
                        text: stats.attack.addCommas(),
                        color: valueCol
                    }],
                    [{
                        text: 'Battle Rank Points'
                    }, {
                        text: stats.rank.battlePoints.addCommas(),
                        color: valueCol
                    }, {
                        text: 'Defense'
                    }, {
                        text: stats.defense.addCommas(),
                        color: valueCol
                    }],
                    [{
                        text: 'War Rank'
                    }, {
                        text: battle.ranks.warRank[stats.rank.war] + ' (' + stats.rank.war + ')',
                        color: valueCol
                    }, {
                        text: 'Health',
                        title: 'Current/Max'
                    }, {
                        text: stats.health.num + '/' + stats.health.max,
                        color: valueCol
                    }],
                    [{
                        text: 'War Rank Points'
                    }, {
                        text: stats.rank.warPoints.addCommas(),
                        color: valueCol
                    }, {
                        text: 'Army'
                    }, {
                        text: stats.army.actual.addCommas(),
                        color: valueCol
                    }],
                    [{
                        text: 'Conquest Rank'
                    }, {
                        text: battle.ranks.conqRank[stats.rank.conquest] + ' (' + stats.rank.conquest + ')',
                        color: valueCol
                    }, {
                        text: 'Generals'
                    }, {
                        text: general.records.length,
                        color: valueCol
                    }],
                    [{
                        text: 'Conquest Rank Points'
                    }, {
                        text: stats.rank.conquestPoints.addCommas(),
                        color: valueCol
                    }, {
                        text: 'Generals When Invade',
                        title: 'For every 5 army members you have, one of your generals will also join the fight.'
                    }, {
                        text: Math.min((stats.army.actual / 5).dp(), general.records.length),
                        color: valueCol
                    }],
                    [{
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }, {
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }],
                    [{
                        text: 'Gold In Bank'
                    }, {
                        text: '$' + stats.gold.bank.addCommas(),
                        color: valueCol
                    }, {
                        text: 'Total Income Per Hour'
                    }, {
                        text: '$' + stats.gold.income.addCommas(),
                        color: valueCol
                    }],
                    [{
                        text: 'Gold In Cash'
                    }, {
                        text: '$' + stats.gold.cash.addCommas(),
                        color: valueCol
                    }, {
                        text: 'Upkeep'
                    }, {
                        text: '$' + stats.gold.upkeep.addCommas(),
                        color: valueCol
                    }],
                    [{
                        text: 'Total Gold'
                    }, {
                        text: '$' + stats.gold.total.addCommas(),
                        color: valueCol
                    }, {
                        text: 'Cash Flow Per Hour'
                    }, {
                        text: '$' + stats.gold.flow.addCommas(),
                        color: valueCol
                    }],
                    [{
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }, {
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }],
                    [{
                        text: 'Skill Points'
                    }, {
                        text: stats.points.skill,
                        color: valueCol
                    }, {
                        text: 'Energy Potions'
                    }, {
                        text: stats.potions.energy,
                        color: valueCol
                    }],
                    [{
                        text: 'Favor Points'
                    }, {
                        text: stats.points.favor,
                        color: valueCol
                    }, {
                        text: 'Stamina Potions'
                    }, {
                        text: stats.potions.stamina,
                        color: valueCol
                    }],
                    [{
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }, {
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }],
                    [{
                        text: 'Experience To Next Level (ETNL)'
                    }, {
                        text: stats.exp.dif.addCommas(),
                        color: valueCol
                    }, {
                        text: 'Battle Strength Index (BSI)'
                    }, {
                        text: stats.indicators.bsi,
                        color: valueCol
                    }],
                    [{
                        text: 'Hours To Level (HTL)'
                    }, {
                        text: $u.minutes2hours(stats.indicators.htl),
                        color: valueCol
                    }, {
                        text: 'Levelling Speed Index (LSI)'
                    }, {
                        text: stats.indicators.lsi,
                        color: valueCol
                    }],
                    [{
                        text: 'Hours Remaining To Level (HRTL)'
                    }, {
                        text: $u.minutes2hours(stats.indicators.hrtl),
                        color: valueCol
                    }, {
                        text: 'Skill Points Per Level (SPPL)'
                    }, {
                        text: stats.indicators.sppl,
                        color: valueCol
                    }],
                    [{
                        text: 'Expected Next Level (ENL)'
                    }, {
                        text: $u.makeTime(stats.indicators.enl, caap.timeStr()),
                        color: valueCol
                    }, {
                        text: 'Attack Power Index (API)'
                    }, {
                        text: stats.indicators.api,
                        color: valueCol
                    }],
                    [{
                        text: 'Build Type'
                    }, {
                        text: stats.indicators.build,
                        color: valueCol
                    }, {
                        text: 'Defense Power Index (DPI)'
                    }, {
                        text: stats.indicators.dpi,
                        color: valueCol
                    }],
                    [{
                        text: 'PvP Class'
                    }, {
                        text: stats.indicators.pvpclass,
                        color: valueCol
                    }, {
                        text: 'Mean Power Index (MPI)'
                    }, {
                        text: stats.indicators.mpi,
                        color: valueCol
                    }],
                    [{
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }, {
                        text: 'Monster Hunting Build Effective Quotent (MHBEQ)'
                    }, {
                        text: stats.indicators.mhbeq,
                        color: valueCol
                    }],
                    [{
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }, {
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }],
                    [{
                        text: 'Battles/Wars Won'
                    }, {
                        text: stats.other.bww.addCommas(),
                        color: valueCol
                    }, {
                        text: 'Times eliminated'
                    }, {
                        text: stats.other.te.addCommas(),
                        color: valueCol
                    }],
                    [{
                        text: 'Battles/Wars Lost'
                    }, {
                        text: stats.other.bwl.addCommas(),
                        color: valueCol
                    }, {
                        text: 'Times you eliminated an enemy'
                    }, {
                        text: stats.other.tee.addCommas(),
                        color: valueCol
                    }],
                    [{
                        text: 'Battles/Wars Win/Loss Ratio (WLR)'
                    }, {
                        text: stats.other.wlr,
                        color: valueCol
                    }, {
                        text: 'Enemy Eliminated/Eliminated Ratio (EER)'
                    }, {
                        text: stats.other.eer,
                        color: valueCol
                    }],
                    [{
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }, {
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }],
                    [{
                        text: 'Invasions Won'
                    }, {
                        text: stats.achievements.battle.invasions.won.addCommas(),
                        color: valueCol
                    }, {
                        text: 'Duels Won'
                    }, {
                        text: stats.achievements.battle.duels.won.addCommas(),
                        color: valueCol
                    }],
                    [{
                        text: 'Invasions Lost'
                    }, {
                        text: stats.achievements.battle.invasions.lost.addCommas(),
                        color: valueCol
                    }, {
                        text: 'Duels Lost'
                    }, {
                        text: stats.achievements.battle.duels.lost.addCommas(),
                        color: valueCol
                    }],
                    [{
                        text: 'Invasions Streak'
                    }, {
                        text: stats.achievements.battle.invasions.streak.addCommas(),
                        color: valueCol
                    }, {
                        text: 'Duels Streak'
                    }, {
                        text: stats.achievements.battle.duels.streak.addCommas(),
                        color: valueCol
                    }],
                    [{
                        text: 'Invasions Win/loss Ratio (IWLR)'
                    }, {
                        text: stats.achievements.battle.invasions.ratio,
                        color: valueCol
                    }, {
                        text: 'Duels Win/loss Ratio (DWLR)'
                    }, {
                        text: stats.achievements.battle.duels.ratio,
                        color: valueCol
                    }],
                    [{
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }, {
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }],
                    [{
                        text: 'Quests Completed'
                    }, {
                        text: stats.other.qc.addCommas(),
                        color: valueCol
                    }, {
                        text: 'Alchemy Performed'
                    }, {
                        text: stats.achievements.other.alchemy.addCommas(),
                        color: valueCol
                    }],
                    [{
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }, {
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }]
                ];

                $j.each(rows, function () {
                    var _row = '';

                    $j.each(this, function () {
                        _row += caap.makeTd(this);
                    });

                    body += caap.makeTr(_row);
                });

                count = 0;
                for (pp in stats.achievements.monster) {
                    if (stats.achievements.monster.hasOwnProperty(pp)) {
                        row = count % 2 === 0 ? '' : row;
                        row += caap.makeTd({
                            text: pp.escapeHTML()
                        });

                        row += caap.makeTd({
                            text: stats.achievements.monster[pp],
                            color: valueCol
                        });

                        body += count % 2 === 1 ? caap.makeTr(row) : '';
                        count += 1;
                    }
                }

                if (count % 2 === 1) {
                    row += caap.makeTd({
                        text: '&nbsp;'
                    });

                    row += caap.makeTd({
                        text: '&nbsp;',
                        color: valueCol
                    });

                    body += caap.makeTr(row);
                }

                rows = [
                    [{
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }, {
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }],
                    [{
                        text: 'Ambrosia Daily Points'
                    }, {
                        text: caap.demi.ambrosia.daily.num + '/' + caap.demi.ambrosia.daily.max,
                        color: valueCol
                    }, {
                        text: 'Malekus Daily Points'
                    }, {
                        text: caap.demi.malekus.daily.num + '/' + caap.demi.malekus.daily.max,
                        color: valueCol
                    }],
                    [{
                        text: 'Ambrosia Total Points'
                    }, {
                        text: caap.demi.ambrosia.power.total,
                        color: valueCol
                    }, {
                        text: 'Malekus Total Points'
                    }, {
                        text: caap.demi.malekus.power.total,
                        color: valueCol
                    }],
                    [{
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }, {
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }],
                    [{
                        text: 'Corvintheus Daily Points'
                    }, {
                        text: caap.demi.corvintheus.daily.num + '/' + caap.demi.corvintheus.daily.max,
                        color: valueCol
                    }, {
                        text: 'Aurora Daily Points'
                    }, {
                        text: caap.demi.aurora.daily.num + '/' + caap.demi.aurora.daily.max,
                        color: valueCol
                    }],
                    [{
                        text: 'Corvintheus Total Points'
                    }, {
                        text: caap.demi.corvintheus.power.total,
                        color: valueCol
                    }, {
                        text: 'Aurora Total Points'
                    }, {
                        text: caap.demi.aurora.power.total,
                        color: valueCol
                    }],
                    [{
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }, {
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }],
                    [{
                        text: 'Azeron Daily Points'
                    }, {
                        text: caap.demi.azeron.daily.num + '/' + caap.demi.azeron.daily.max,
                        color: valueCol
                    }, {
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }],
                    [{
                        text: 'Azeron Total Points'
                    }, {
                        text: caap.demi.azeron.power.total,
                        color: valueCol
                    }, {
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }],
                    [{
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }, {
                        text: '&nbsp;'
                    }, {
                        text: '&nbsp;',
                        color: valueCol
                    }]
                ];

                $j.each(rows, function () {
                    var _row = '';

                    $j.each(this, function () {
                        _row += caap.makeTd(this);
                    });

                    body += caap.makeTr(_row);
                });

                body += caap.makeTr(row);
                count = 0;
                for (pp in stats.character) {
                    if (stats.character.hasOwnProperty(pp)) {
                        row = count % 2 === 0 ? '' : row;
                        row += caap.makeTd({
                            text: pp
                        });

                        row += caap.makeTd({
                            text: "Level " + stats.character[pp].level + " (" + stats.character[pp].percent + "%)",
                            color: valueCol
                        });

                        body += count % 2 === 1 ? caap.makeTr(row) : '';
                        count += 1;
                    }
                }

                if (count % 2 === 1) {
                    row += caap.makeTd({
                        text: '&nbsp;'
                    });

                    row += caap.makeTd({
                        text: '&nbsp;',
                        color: valueCol
                    });

                    body += caap.makeTr(row);
                }

                $j("#caap_userStats", caap.caapTopObject).html(caap.makeTable("user", head, body));
                session.setItem("UserDashUpdate", false);
            }

            return true;
        } catch (err) {
            con.error("ERROR in statsFunc.dashboard: " + err.stack);
            return false;
        }
    };

}());
