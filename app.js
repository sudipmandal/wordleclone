const { createApp } = Vue

 createApp({
  data() {
    return {
      dictionary: null,
      animationSpeed: 200,
      wordSize: 5,
      tries: 6,
      activeTry: 0,
      activeChar: 0,
      userTryMatrix: [],
      secretWord: "",
      keyBoardKeys: []
    };
  },
  async created() {
    await this.initDictionary();
    this.initGame();
    //initialize sliders
    this.initSliders();

    document.addEventListener("keydown", this.processKeypress);
  },
  watch: {
    wordSize: {
      handler: async function () {
        await this.initDictionary();
        this.initGame();
      }
    },
    tries: {
      handler: async function () {
        await this.initDictionary();
        this.initGame();
      }
    }
  },
  methods: {
    initSliders() {
      let $this = this;
      $(".ui.wordsize.slider").slider({
        min: 4,
        max: 7,
        start: this.wordSize,
        smooth: true,
        onChange: function (v) {
          $this.wordSize = v;
        }
      });

      $(".ui.tries.slider").slider({
        min: 4,
        max: 9,
        start: this.tries,
        smooth: true,
        onChange: function (v) {
          $this.tries = v;
        }
      });
    },
    async initDictionary() {
      let engDicUrl =
        "https://raw.githubusercontent.com/dolph/dictionary/master/popular.txt";
      let rawData = await (await fetch(engDicUrl)).text();
      let dicWords = rawData.split("\n");
      this.dictionary = dicWords.filter((x) => x.length == this.wordSize);

      //pick random word
      this.secretWord = this.dictionary[
        Math.floor(Math.random() * (this.dictionary.length + 1))
      ].toUpperCase();
    },
    initGame() {
      this.keyBoardKeys = this.getKeyPad();
      this.userTryMatrix = [];
      this.activeChar = 0;
      this.activeTry = 0;
      for (let c = 0; c < this.tries; c++) {
        let initCharArr = [];
        for (let i = 0; i < this.wordSize; i++) {
          initCharArr.push({
            val: "",
            isGreen: false,
            isYellow: false,
            isGrey: false
          });
        }
        this.userTryMatrix.push(initCharArr);
      }
    },
    giveUp() {
      let $this = this;
      $.toast({
        displayTime: 5000,
        class: "teal",
        message: `The word was ` + this.secretWord,
        onHidden: function () {
          $this.initGame();
        }
      });
    },
    isBasic(tindex, cindex) {
      let item = this.userTryMatrix[tindex][cindex];
      if (!(item.isGreen || item.isYellow || item.isGrey)) return true;
      else return false;
    },
    setRowBG(arrPos) {
      let $this = this;
      for (let i = 0; i < this.wordSize; i++) {
        let gc = this.userTryMatrix[arrPos][i].val.toUpperCase();
        console.log(gc);
        if (gc == this.secretWord.split("")[i]) {
          setTimeout(function () {
            $this.userTryMatrix[arrPos][i].isGreen = true;
          }, this.animationSpeed * i);
          continue;
        }

        if (this.secretWord.split("").find((x) => x == gc) != null) {
          setTimeout(function () {
            $this.userTryMatrix[arrPos][i].isYellow = true;
          }, this.animationSpeed * i);
          continue;
        }

        setTimeout(function () {
          $this.userTryMatrix[arrPos][i].isGrey = true;
          $this.greyoutKeyOnKeypad(gc);
        }, this.animationSpeed * i);
      }
    },
    greyoutKeyOnKeypad(c) {
      for (let r = 0; r < this.keyBoardKeys.length; r++) {
        for (let p = 0; p < this.keyBoardKeys[r].length; p++) {
          if (
            this.keyBoardKeys[r][p].isCharKey &&
            this.keyBoardKeys[r][p].char == c
          ) {
            this.keyBoardKeys[r][p].isDisabled = true;
            return;
          }
        }
      }
    },
    processGuess() {
      let guessArr = this.userTryMatrix[this.activeTry].map((x) => x.val);
      let usersGuess = guessArr.join("").toUpperCase();
      console.log(usersGuess);
      this.setRowBG(this.activeTry);
      if (usersGuess == this.secretWord) {
        //user won game
        $.toast({
          class: "success",
          displayTime: 0,
          message: `You Won!`
        });
        return true;
      } else {
        return false;
      }
    },
    isGuessValidWord() {
      let guessArr = this.userTryMatrix[this.activeTry].map((x) => x.val);
      let usersGuess = guessArr.join("").toUpperCase();

      if (this.dictionary.find((x) => x.toUpperCase() == usersGuess))
        return true;
      else return false;
    },
    processEnter() {
      if (this.activeChar == this.wordSize) {
        if (!this.isGuessValidWord()) {
          $.toast({
            class: "error",
            displayTime: 500,
            message: `Invalid word`
          });
          return;
        }
        let isGuessCorrect = this.processGuess();

        if (!isGuessCorrect) {
          if (this.activeTry < this.tries) {
            this.activeTry++;
            this.activeChar = 0;
          }
        }

        if (this.activeTry >= this.tries) {
          $.toast({
            class: "error",
            displayTime: 0,
            message: `You lost - word was ` + this.secretWord
          });
        }
      } else {
        $.toast({
          class: "error",
          displayTime: 500,
          message: `Too short!`
        });
      }
    },
    processBackSpace() {
      if (this.activeChar > 0) {
        this.activeChar--;
        this.userTryMatrix[this.activeTry][this.activeChar].val = "";
      }
    },
    setAlphabet(c) {
      //check if valid key press
      if (/[a-zA-Z]/i.test(c) && c.length == 1) {
        if (this.activeTry < this.tries && this.activeChar < this.wordSize) {
          this.userTryMatrix[this.activeTry][this.activeChar].val = c;
          this.activeChar++;
        }
      }
    },
    processKeypress(event) {
      if (event.keyCode == 13) {
        //Enter
        this.processEnter();
      } else if (event.keyCode == 8) {
        //Backspace
        console.log("BK");
        this.processBackSpace();
      } else {
        this.setAlphabet(event.key);
      }
    },
    getKeyButton(char, row, pos) {
      let k = {};
      k.row = row;
      k.pos = pos;
      k.isDisabled = false;

      if (char.length > 1) {
        k.isCharKey = false;
        if (char == "BK") {
          k.isBackspace = true;
        } else {
          k.isBackspace = false;
        }
      } else {
        k.isCharKey = true;
        k.char = char;
      }
      return k;
    },
    getKeyPad() {
      let kp = [
        { char: "Q", row: 1, pos: 1 },
        { char: "W", row: 1, pos: 2 },
        { char: "E", row: 1, pos: 3 },
        { char: "R", row: 1, pos: 4 },
        { char: "T", row: 1, pos: 5 },
        { char: "Y", row: 1, pos: 6 },
        { char: "U", row: 1, pos: 7 },
        { char: "I", row: 1, pos: 8 },
        { char: "O", row: 1, pos: 9 },
        { char: "P", row: 1, pos: 10 },
        { char: "A", row: 2, pos: 1 },
        { char: "S", row: 2, pos: 2 },
        { char: "D", row: 2, pos: 3 },
        { char: "F", row: 2, pos: 4 },
        { char: "G", row: 2, pos: 5 },
        { char: "H", row: 2, pos: 6 },
        { char: "J", row: 2, pos: 7 },
        { char: "K", row: 2, pos: 8 },
        { char: "L", row: 2, pos: 9 },
        { char: "BK", row: 3, pos: 1 },
        { char: "Z", row: 3, pos: 2 },
        { char: "X", row: 3, pos: 3 },
        { char: "C", row: 3, pos: 4 },
        { char: "V", row: 3, pos: 5 },
        { char: "B", row: 3, pos: 6 },
        { char: "N", row: 3, pos: 7 },
        { char: "M", row: 3, pos: 8 },
        { char: "ET", row: 3, pos: 9 }
      ];

      let keyPad = [];
      for (let k of kp) {
        keyPad.push(this.getKeyButton(k.char, k.row, k.pos));
      }

      let uiKeyPad = [];
      let distinctRows = [...new Set(keyPad.map((x) => x.row))];
      for (let r of distinctRows) {
        let uik = keyPad
          .filter((x) => x.row == r)
          .sort((a, b) => a.pos - b.pos);

        uiKeyPad.push(uik);
      }

      return uiKeyPad;
    }
  }
}).mount('#app');
