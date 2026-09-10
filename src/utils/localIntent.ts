import { FunctionCallData } from '../types';

export interface LocalMatchResult {
  toolCall?: FunctionCallData;
  companionText: string;
}

export function matchLocalCommandIntent(rawText: string): LocalMatchResult | null {
  if (!rawText) return null;
  const t = rawText.toLowerCase().trim();

  // Helper to detect Hindi / Hinglish query phrasing
  const isHindi =
    t.includes('karo') ||
    t.includes('kijiye') ||
    t.includes('bhejo') ||
    t.includes('lagao') ||
    t.includes('chalao') ||
    t.includes('kaisa') ||
    t.includes('kaisi') ||
    t.includes('hai') ||
    t.includes('batao') ||
    t.includes('sunao') ||
    t.includes('namaste') ||
    t.includes('kaise') ||
    t.includes('kitni') ||
    t.includes('badhao') ||
    t.includes('kam') ||
    t.includes('band') ||
    t.includes('chalu') ||
    t.includes('bujhao') ||
    t.includes('jalao') ||
    t.includes('shukriya') ||
    t.includes('dhanyawad') ||
    t.includes('kholo') ||
    t.includes('kaun') ||
    t.includes('gaana') ||
    t.includes('khicho') ||
    t.includes('kaato') ||
    t.includes('subah');

  // Emergency Stop Intent Check (Highest Priority)
  if (
    t.includes('stop automation') ||
    t.includes('emergency stop') ||
    t.includes('abort automation') ||
    t.includes('cancel automation') ||
    t.includes('automation roko') ||
    t.includes('automation band karo') ||
    t === 'stop' ||
    t === 'halt' ||
    t === 'abort'
  ) {
    return {
      toolCall: { name: 'emergencyStopAutomation', args: { reason: 'User emergency stop request' } },
      companionText: isHindi
        ? 'EMERGENCY STOP: Sabhi active automation actions ko turant rok diya gaya hai.'
        : 'EMERGENCY STOP ACTIVATED: All automation actions have been immediately halted.',
    };
  }

  // 1. Navigation intents
  if (
    t === 'go home' ||
    t === 'home' ||
    t === 'home screen' ||
    t === 'home jao' ||
    t === 'ghar' ||
    t.includes('home jao') ||
    t.includes('home screen par jao') ||
    t === 'launcher'
  ) {
    return {
      toolCall: { name: 'systemNavigation', args: { action: 'goHome' } },
      companionText: isHindi ? 'Home screen par le chal rahi hoon.' : 'Going to Home screen.',
    };
  }

  if (
    t === 'go back' ||
    t === 'back' ||
    t === 'back jao' ||
    t === 'piche jao' ||
    t === 'piche' ||
    t.includes('go back') ||
    t.includes('wapas jao')
  ) {
    return {
      toolCall: { name: 'systemNavigation', args: { action: 'goBack' } },
      companionText: isHindi ? 'Wapas pichli screen par aa gaye.' : 'Going back.',
    };
  }

  if (
    t.includes('quick settings') ||
    t.includes('notification panel') ||
    t.includes('notifications panel') ||
    t.includes('notifications kholo') ||
    t.includes('panel kholo')
  ) {
    return {
      toolCall: { name: 'systemNavigation', args: { action: 'openQuickSettings' } },
      companionText: isHindi ? 'Quick Settings panel open kar diya hai.' : 'Opening Quick Settings.',
    };
  }

  if (t.includes('recent apps') || t.includes('multitasking') || t.includes('recents')) {
    return {
      toolCall: { name: 'systemNavigation', args: { action: 'openRecentApps' } },
      companionText: isHindi ? 'Recent apps open kar diye hain.' : 'Opening recent apps overview.',
    };
  }

  // Android Automation Hub & Routines
  if (
    t.includes('automation') ||
    t.includes('routine') ||
    t.includes('macro') ||
    t.includes('automate')
  ) {
    if (t.includes('morning') || t.includes('subah')) {
      return {
        toolCall: {
          name: 'chainPhoneActions',
          args: {
            title: 'Morning Briefing & News',
            steps: [
              { action: 'toggleSetting', setting: 'volume', value: 75, description: 'Set volume to 75%' },
              { action: 'deviceHardwareControl', controlAction: 'getBatteryStatus', description: 'Check battery' },
              { action: 'openApp', appName: 'Chrome', description: 'Open Chrome' },
              { action: 'typeText', text: 'Today top headlines and weather update', description: 'Search news' },
              { action: 'scrollScreen', direction: 'down', amount: 'medium', description: 'Scroll feed' },
            ],
          },
        },
        companionText: isHindi
          ? 'Morning routine start kar di hai: Volume set, battery check, aur news feed launch ho raha hai.'
          : 'Starting morning routine: Volume adjusted, battery verified, and opening news headlines.',
      };
    }

    if (t.includes('bedtime') || t.includes('sleep') || t.includes('sone') || t.includes('night')) {
      return {
        toolCall: {
          name: 'chainPhoneActions',
          args: {
            title: 'Bedtime / Sleep Mode',
            steps: [
              { action: 'deviceHardwareControl', controlAction: 'toggleDnd', value: 'on', description: 'Turn on DND' },
              { action: 'toggleSetting', setting: 'brightness', value: 15, description: 'Lower brightness to 15%' },
              { action: 'deviceHardwareControl', controlAction: 'setRingerMode', value: 'silent', description: 'Set ringer to silent' },
              { action: 'setAlarm', time: '07:00 AM', label: 'Wake up', description: 'Set 7:00 AM alarm' },
            ],
          },
        },
        companionText: isHindi
          ? 'Bedtime routine activate kar di: DND on, brightness 15%, silent mode, aur 7:00 AM ka alarm set ho gaya.'
          : 'Bedtime routine activated: DND enabled, screen dimmed, ringer muted, and 7:00 AM alarm set.',
      };
    }

    if (t.includes('battery') || t.includes('bachao')) {
      return {
        toolCall: {
          name: 'chainPhoneActions',
          args: {
            title: 'Extreme Battery Saver',
            steps: [
              { action: 'deviceHardwareControl', controlAction: 'toggleBatterySaver', value: 'on', description: 'Enable battery saver' },
              { action: 'toggleSetting', setting: 'wifi', value: false, description: 'Disable Wi-Fi' },
              { action: 'toggleSetting', setting: 'brightness', value: 20, description: 'Lower brightness to 20%' },
              { action: 'deviceHardwareControl', controlAction: 'getBatteryStatus', description: 'Check battery status' },
            ],
          },
        },
        companionText: isHindi
          ? 'Extreme Battery Saver routine chalu kar di hai.'
          : 'Extreme Battery Saver routine engaged.',
      };
    }

    // Default to opening the Automation Studio
    return {
      toolCall: { name: 'systemNavigation', args: { action: 'openAutomation' } },
      companionText: isHindi
        ? 'Android Automation Hub open kar diya hai. Yahan aap automated routines, accessibility gestures aur macros use kar sakte hain.'
        : 'Opening Android Automation Hub. You can run one-touch routines, test gestures, and build custom macros.',
    };
  }

  // 2. Torch / Flashlight
  if (t.includes('torch') || t.includes('flashlight') || t.includes('batti')) {
    const isOff =
      t.includes('off') ||
      t.includes('band') ||
      t.includes('bujhao') ||
      t.includes('disable') ||
      t.includes('hatao');
    return {
      toolCall: { name: 'toggleSystemSetting', args: { setting: 'flashlight', value: isOff ? 'off' : 'on' } },
      companionText: isOff
        ? (isHindi ? 'Flashlight band kar di hai.' : 'Flashlight turned off.')
        : (isHindi ? 'Haan ji, Flashlight on kar di hai.' : 'Flashlight turned on.'),
    };
  }

  // 3. Wi-Fi
  if (t.includes('wifi') || t.includes('wi-fi')) {
    const isOff = t.includes('off') || t.includes('band') || t.includes('disable') || t.includes('hatao');
    return {
      toolCall: { name: 'toggleSystemSetting', args: { setting: 'wifi', value: isOff ? 'off' : 'on' } },
      companionText: isOff
        ? (isHindi ? 'Wi-Fi disconnect karke band kar diya hai.' : 'Wi-Fi turned off.')
        : (isHindi ? 'Wi-Fi on kar diya hai.' : 'Wi-Fi turned on.'),
    };
  }

  // 4. Bluetooth
  if (t.includes('bluetooth')) {
    const isOff = t.includes('off') || t.includes('band') || t.includes('disable');
    return {
      toolCall: { name: 'toggleSystemSetting', args: { setting: 'bluetooth', value: isOff ? 'off' : 'on' } },
      companionText: isOff
        ? (isHindi ? 'Bluetooth band kar diya hai.' : 'Bluetooth turned off.')
        : (isHindi ? 'Bluetooth on kar diya hai.' : 'Bluetooth turned on.'),
    };
  }

  // 5. Volume & Mute Controls
  if (t.includes('volume') || t.includes('awaz') || t.includes('sound') || t.includes('mute') || t.includes('silent')) {
    if (t.includes('mute') || t.includes('silent') || t.includes('chup')) {
      return {
        toolCall: { name: 'toggleSystemSetting', args: { setting: 'volume', value: 0 } },
        companionText: isHindi ? 'Device ko silent mode par kar diya hai.' : 'Device muted.',
      };
    }
    if (t.includes('badhao') || t.includes('increase') || t.includes('up') || t.includes('tez')) {
      return {
        toolCall: { name: 'toggleSystemSetting', args: { setting: 'volume', value: 90 } },
        companionText: isHindi ? 'Volume badha diya hai (90%).' : 'Volume increased to 90%.',
      };
    }
    if (t.includes('kam') || t.includes('decrease') || t.includes('down') || t.includes('ghatao')) {
      return {
        toolCall: { name: 'toggleSystemSetting', args: { setting: 'volume', value: 40 } },
        companionText: isHindi ? 'Volume kam kar diya hai (40%).' : 'Volume decreased to 40%.',
      };
    }
  }

  // 6. Alarms & Timers
  if (t.includes('alarm') || t.includes('wake me') || t.includes('jaga dena')) {
    let alarmTime = '07:00 AM';
    if (t.includes('6') || t.includes('che')) alarmTime = '06:00 AM';
    else if (t.includes('8') || t.includes('aath')) alarmTime = '08:00 AM';
    else if (t.includes('9') || t.includes('nau')) alarmTime = '09:00 AM';
    else if (t.includes('7') || t.includes('saat')) alarmTime = '07:00 AM';

    return {
      toolCall: { name: 'setAlarmOrTimer', args: { type: 'alarm', time: alarmTime, label: 'Morning Alarm' } },
      companionText: isHindi
        ? `Subah ${alarmTime} ka alarm set kar diya hai.`
        : `Alarm set for ${alarmTime}.`,
    };
  }

  if (t.includes('timer')) {
    let mins = 5;
    if (t.includes('10')) mins = 10;
    else if (t.includes('15')) mins = 15;
    else if (t.includes('2')) mins = 2;
    else if (t.includes('3')) mins = 3;

    return {
      toolCall: { name: 'setAlarmOrTimer', args: { type: 'timer', minutes: mins, label: 'Timer' } },
      companionText: isHindi
        ? `${mins} minute ka timer shuru kar diya hai.`
        : `Timer set for ${mins} minutes.`,
    };
  }

  // 7. Battery Status
  if (t.includes('battery') || t.includes('charge kitna') || t.includes('charging')) {
    return {
      toolCall: { name: 'deviceHardwareControl', args: { action: 'getBatteryStatus' } },
      companionText: isHindi
        ? 'Battery 85% charged hai, phone bilkul optimal condition mein hai.'
        : 'Battery level is 85%, healthy and optimal.',
    };
  }

  // 7b. Screenshot Capture
  if (t.includes('screenshot') || t.includes('screen capture') || t.includes('screen photo') || t.includes('screen khicho')) {
    return {
      toolCall: { name: 'deviceHardwareControl', args: { action: 'takeScreenshot' } },
      companionText: isHindi
        ? 'Screenshot capture karke Gallery mein save kar liya hai 📸.'
        : 'Screenshot captured and saved to Gallery 📸.',
    };
  }

  // 7c. Do Not Disturb (DND)
  if (t.includes('do not disturb') || t.includes('dnd') || t.includes('disturb mat karo') || t.includes('pareshan mat')) {
    const isOff = t.includes('off') || t.includes('band') || t.includes('hatao');
    return {
      toolCall: { name: 'deviceHardwareControl', args: { action: 'toggleDND', value: isOff ? 'off' : 'on' } },
      companionText: isOff
        ? (isHindi ? 'Do Not Disturb mode off kar diya hai.' : 'Do Not Disturb mode turned off.')
        : (isHindi ? 'Do Not Disturb mode on kar diya hai. Calls aur notifications silent rahenge.' : 'Do Not Disturb turned on.'),
    };
  }

  // 7d. Mobile Hotspot
  if (t.includes('hotspot') || t.includes('tethering')) {
    const isOff = t.includes('off') || t.includes('band');
    return {
      toolCall: { name: 'deviceHardwareControl', args: { action: 'toggleHotspot', value: isOff ? 'off' : 'on' } },
      companionText: isOff
        ? (isHindi ? 'Portable Hotspot band kar diya hai.' : 'Mobile Hotspot turned off.')
        : (isHindi ? 'Portable Hotspot on kar diya hai.' : 'Mobile Hotspot turned on.'),
    };
  }

  // 7e. Battery Saver
  if (t.includes('battery saver') || t.includes('power saving') || t.includes('battery bachao')) {
    const isOff = t.includes('off') || t.includes('band');
    return {
      toolCall: { name: 'deviceHardwareControl', args: { action: 'toggleBatterySaver', value: isOff ? 'off' : 'on' } },
      companionText: isOff
        ? (isHindi ? 'Battery Saver off kar diya hai.' : 'Battery Saver turned off.')
        : (isHindi ? 'Battery Saver on kar diya hai background activity limit karne ke liye.' : 'Battery Saver turned on.'),
    };
  }

  // 7f. Airplane Mode
  if (t.includes('airplane mode') || t.includes('flight mode') || t.includes('aeroplane')) {
    const isOff = t.includes('off') || t.includes('band');
    return {
      toolCall: { name: 'deviceHardwareControl', args: { action: 'toggleAirplaneMode', value: isOff ? 'off' : 'on' } },
      companionText: isOff
        ? (isHindi ? 'Airplane mode band kar diya hai.' : 'Airplane mode turned off.')
        : (isHindi ? 'Airplane mode on kar diya hai, sabhi radios band hain.' : 'Airplane mode turned on.'),
    };
  }

  // 7g. Auto-rotate
  if (t.includes('auto rotate') || t.includes('autorotate') || t.includes('rotation') || t.includes('screen ghumao')) {
    const isOff = t.includes('off') || t.includes('band') || t.includes('lock');
    return {
      toolCall: { name: 'deviceHardwareControl', args: { action: 'toggleAutoRotate', value: isOff ? 'off' : 'on' } },
      companionText: isOff
        ? (isHindi ? 'Auto-rotate band kar diya hai, screen portrait locked hai.' : 'Auto-rotate turned off (locked).')
        : (isHindi ? 'Auto-rotate on kar diya hai.' : 'Auto-rotate turned on.'),
    };
  }

  // 7h. Location (GPS)
  if (t.includes('location') || t.includes('gps') || t.includes('sthan')) {
    const isOff = t.includes('off') || t.includes('band');
    return {
      toolCall: { name: 'deviceHardwareControl', args: { action: 'toggleLocation', value: isOff ? 'off' : 'on' } },
      companionText: isOff
        ? (isHindi ? 'GPS Location service band kar di hai.' : 'Location services turned off.')
        : (isHindi ? 'GPS Location service on kar di hai.' : 'Location services turned on.'),
    };
  }

  // 7i. Ringer Mode (Vibrate, Silent, Ring)
  if (t.includes('vibrate') || t.includes('vibration') || t.includes('kampan')) {
    return {
      toolCall: { name: 'deviceHardwareControl', args: { action: 'setRingerMode', value: 'vibrate' } },
      companionText: isHindi ? 'Phone ringer vibrate par set kar diya hai.' : 'Phone set to vibrate mode.',
    };
  }
  if (t.includes('silent mode') || t.includes('phone silent karo')) {
    return {
      toolCall: { name: 'deviceHardwareControl', args: { action: 'setRingerMode', value: 'silent' } },
      companionText: isHindi ? 'Phone silent mode par kar diya gaya hai.' : 'Phone silenced.',
    };
  }
  if (t.includes('normal mode') || t.includes('ringer on') || t.includes('sound on karo')) {
    return {
      toolCall: { name: 'deviceHardwareControl', args: { action: 'setRingerMode', value: 'normal' } },
      companionText: isHindi ? 'Normal sound ringer on kar diya hai.' : 'Ringer restored to normal mode.',
    };
  }

  // 8. Weather Report
  if (t.includes('mausam') || t.includes('weather') || t.includes('temperature') || t.includes('taapmaan')) {
    return {
      companionText: isHindi
        ? 'Aaj mausam suhana aur saaf hai, dhoop nikli hai aur taapmaan lagbhag 26°C hai.'
        : 'The weather is pleasant and clear today, with sunny skies and 26°C.',
    };
  }

  // 9. Camera & Selfie
  if (t.includes('camera') || t.includes('photo khicho') || t.includes('selfie') || t.includes('photo lo')) {
    return {
      toolCall: { name: 'openApp', args: { appName: 'Camera' } },
      companionText: isHindi ? 'Camera open ho gaya hai, photo click karne ke liye taiyar.' : 'Opening Camera.',
    };
  }

  // 10. YouTube & Video
  if (t.includes('youtube')) {
    return {
      toolCall: { name: 'openApp', args: { appName: 'YouTube' } },
      companionText: isHindi ? 'YouTube app open kiya ja raha hai.' : 'Opening YouTube.',
    };
  }

  // 11. Spotify / Music
  if (t.includes('spotify') || t.includes('play music') || t.includes('gaana chalao') || t.includes('music chalao') || t.includes('song bajao') || t.includes('gana bajao')) {
    if (t.includes('band') || t.includes('stop') || t.includes('pause') || t.includes('roko')) {
      return {
        toolCall: { name: 'callAndMedia', args: { action: 'pauseMedia' } },
        companionText: isHindi ? 'Music pause kar diya gaya hai.' : 'Media playback paused.',
      };
    }
    return {
      toolCall: { name: 'callAndMedia', args: { action: 'playMedia', appName: 'Spotify', query: 'Bollywood & Chill Vibes' } },
      companionText: isHindi
        ? 'Spotify par aapke pasandeeda songs play ho rahe hain.'
        : 'Playing relaxing music on Spotify.',
    };
  }

  // 12. Phone Calls
  if (t.startsWith('call ') || t.includes(' ko call') || t.includes('ko phone') || t.includes('call lagao') || t.includes('phone milao')) {
    let name = 'Rahul Sharma';
    if (t.includes('priya')) name = 'Priya Patel';
    else if (t.includes('mom') || t.includes('maa') || t.includes('mummy')) name = 'Mom';
    else if (t.includes('alex')) name = 'Alex';

    return {
      toolCall: { name: 'callAndMedia', args: { action: 'makeCall', contactName: name } },
      companionText: isHindi ? `${name} ko call lagaya ja raha hai...` : `Calling ${name}...`,
    };
  }

  if (t.includes('end call') || t.includes('cut call') || t.includes('call kaato') || t.includes('call cut') || t.includes('phone kaato')) {
    return {
      toolCall: { name: 'callAndMedia', args: { action: 'endCall' } },
      companionText: isHindi ? 'Call disconnect kar di hai.' : 'Call ended.',
    };
  }

  // 13. Messaging & WhatsApp
  if (t.includes('whatsapp') && (t.includes('bhejo') || t.includes('send') || t.includes('message') || t.includes('rahul') || t.includes('priya') || t.includes('kaho') || t.includes('bolo'))) {
    let name = 'Rahul Sharma';
    let msg = 'Hey! What is the update on our project plans?';
    if (t.includes('priya')) {
      name = 'Priya Patel';
      msg = 'Hey Priya, kal meeting mein milte hain.';
    } else if (t.includes('mom') || t.includes('maa')) {
      name = 'Mom';
      msg = 'Haan Maa, main thodi der mein ghar aa raha hoon.';
    }

    return {
      toolCall: {
        name: 'sendWhatsAppMessage',
        args: {
          contactName: name,
          message: msg,
        },
      },
      companionText: isHindi
        ? `${name} ke liye WhatsApp message draft kar diya hai.`
        : `Drafting WhatsApp message for ${name}.`,
    };
  }

  if (t.includes('sms') && (t.includes('bhejo') || t.includes('send') || t.includes('rahul') || t.includes('priya'))) {
    let name = 'Rahul Sharma';
    if (t.includes('priya')) name = 'Priya Patel';
    return {
      toolCall: {
        name: 'sendUniversalMessage',
        args: {
          app: 'sms',
          contactName: name,
          message: 'Hey! I will be reaching in 15 minutes.',
        },
      },
      companionText: isHindi ? `${name} ke liye SMS draft kar diya hai.` : `Drafting SMS message for ${name}.`,
    };
  }

  // 14. App Openers
  if (t.includes('chrome') || t.includes('browser') || t.includes('google search')) {
    return {
      toolCall: { name: 'openApp', args: { appName: 'Chrome' } },
      companionText: isHindi ? 'Google Chrome open kar diya hai.' : 'Opening Google Chrome browser.',
    };
  }

  if (t.includes('insta')) {
    return {
      toolCall: { name: 'openApp', args: { appName: 'Instagram' } },
      companionText: isHindi ? 'Instagram feed open kiya ja raha hai.' : 'Opening Instagram.',
    };
  }

  if (t.includes('settings') && !t.includes('quick')) {
    return {
      toolCall: { name: 'openApp', args: { appName: 'Settings' } },
      companionText: isHindi ? 'Android Settings open ho rahi hain.' : 'Opening Android Settings.',
    };
  }

  // 15. Gestures
  if (t.includes('scroll down') || t === 'scroll' || t.includes('niche scroll') || t.includes('scroll karo')) {
    return {
      toolCall: { name: 'interactScreen', args: { action: 'scrollScreen', direction: 'down' } },
      companionText: isHindi ? 'Screen niche scroll kar di hai.' : 'Scrolling down screen.',
    };
  }

  if (t.includes('scroll up') || t.includes('upar scroll')) {
    return {
      toolCall: { name: 'interactScreen', args: { action: 'scrollScreen', direction: 'up' } },
      companionText: isHindi ? 'Screen upar scroll kar di hai.' : 'Scrolling up screen.',
    };
  }

  if (t.includes('like') || t.includes('double tap')) {
    return {
      toolCall: { name: 'interactScreen', args: { action: 'doubleTap', description: 'post' } },
      companionText: isHindi ? 'Post like kar diya hai.' : 'Double tapping to like.',
    };
  }

  // 16. Assistant Persona & Greetings
  if (t === 'namaste' || t === 'hello' || t === 'hi' || t === 'kaise ho' || t.includes('kya haal hai')) {
    return {
      companionText: isHindi
        ? 'Namaste! Main Nova hoon, aapki AI assistant. Main phone control karne, WhatsApp message bhejne aur aapke sawalon ka jawab dene ke liye taiyar hoon.'
        : 'Hello! I am Nova, your AI assistant. I am ready to control phone actions, send messages, and assist you with anything.',
    };
  }

  if (t.includes('tum kaun ho') || t.includes('who are you') || t.includes('aap kaun ho')) {
    return {
      companionText: isHindi
        ? 'Main Nova hoon — aapka bilingual AI voice companion aur smart Android controller. Aap mujhe Hindi ya English kisi bhi bhasha mein command de sakte hain.'
        : 'I am Nova — your bilingual AI voice companion and smart phone controller. You can give me commands in either English or Hindi.',
    };
  }

  return null;
}
