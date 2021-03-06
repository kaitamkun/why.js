#ifndef WVM_MODE_MEMORYMODE_H_
#define WVM_MODE_MEMORYMODE_H_

#include <condition_variable>
#include <map>
#include <mutex>
#include <optional>
#include <thread>
#include <unordered_set>

#include "haunted/core/terminal.h"
#include "haunted/ui/boxes/expandobox.h"
#include "haunted/ui/textbox.h"
#include "haunted/ui/textinput.h"
#include "mode/ClientMode.h"
#include "VM.h"

namespace WVM::Mode {
	class MemoryMode: public ClientMode {
		private:
			haunted::terminal terminal;
			haunted::ui::boxes::expandobox *expando;
			haunted::ui::textbox *textbox;
			haunted::ui::textinput *textinput;
			VM vm;
			std::map<int, std::shared_ptr<haunted::ui::textline>> lines;
			std::unordered_set<Word> symbolTableEdges;
			bool follow = true, fastForward = false, showSymbols = false, searching = false;

			int autotick = -50'000;
			std::thread autotickThread;
			bool autotickReady = false;
			std::mutex autotickMutex;
			std::condition_variable autotickVariable;

			std::thread networkThread;
			std::mutex networkMutex;

			void startAutotick();
			void send(const std::string &);
			void jumpToPC();
			haunted::ui::simpleline & getLine(Word address);
			haunted::ui::simpleline & addLine(Word address);
			void addBreakpoint(Word);
			void removeBreakpoint(Word);

		public:
			Word min = 0, max = 0;
			int padding = 6;

			MemoryMode(): ClientMode(), vm(0) {}
			~MemoryMode();

			void run(const std::string &hostname, int port) override;
			void remakeList();
			std::string stringify(Word address) const;
			void updateLine(Word address, bool careless = false);
			void makeSymbolTableEdges();
			void stop() override;
			void setFastForward(bool);
			void handleMessage(const std::string &) override;
			void toggleSearchbox();
	};
}

#endif
