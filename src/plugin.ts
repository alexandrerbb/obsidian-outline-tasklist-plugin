/**
 * Outline to task list plugin.
 *
 * A simple Obsidian plugin to convert a note's outline to a task list.
 */
import {
  Plugin,
  type Editor,
  type MarkdownView,
  type TFile,
  type TFolder,
} from "obsidian";
import { TaskList, TaskListInterface } from "src/taskList";

interface OutlineTaskListPluginSettings {
  maxNoteCreationReties: number;
}

const DEFAULT_SETTINGS: OutlineTaskListPluginSettings = {
  maxNoteCreationReties: 200,
};

export default class OutlineTaskListPlugin extends Plugin {
  /**
   * Plugin settings.
   */
  settings: OutlineTaskListPluginSettings;

  /**
   * Create an Obsidian note to store the resulting task list.
   */
  async createNote(originalName: string, folder: TFolder | null, makdownContent: string): Promise<TFile> {
    const dirPath = folder === null ? "" : folder.path + "/";
    for (let index = 1; index < this.settings.maxNoteCreationReties; index++) {
      try {
        return await this.app.vault.create(
          dirPath +
          `${originalName} (task list${index === 1 ? "" : " " + index}).md`,
          makdownContent,
        );
      } catch (e) {
        continue; // File already exists.
      }
    }
    throw Error("Maximum note creation retries exceeded.");
  }

  /**
   * Custom editor callback.
   */
  static callback<T>(
    callback: ({ editor, file, tasks }: { editor: Editor; file: TFile; tasks: TaskListInterface; }) => T,
  ): (editor: Editor, view: MarkdownView) => T {
    return (editor: Editor, view: MarkdownView) => {
      const file = view.file;
      if (!file) {
        throw Error("Cannot find the current note.");
      }
      const tasks = TaskList();
      tasks.parseOutline(editor.getValue());
      return callback({ editor, file, tasks });
    };
  }

  async onload(): Promise<void> {
    // Load settings.
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    // Add commands.
    this.addCommand({
      name: "Convert outline to a task list here.",
      id: "outline-task-list-insert",
      editorCallback: OutlineTaskListPlugin.callback(({ editor, tasks }) => {
        editor.replaceRange(tasks.toMarkdown(), editor.getCursor());
      }),
    });
    this.addCommand({
      name: "Convert outline to a task list in a new note.",
      id: "outline-task-list-new-note",
      editorCallback: OutlineTaskListPlugin.callback(async ({ file, tasks }) => {
        // Create a new note.
        await this.createNote(file.basename, file.parent, tasks.toMarkdown());
      }),
    });
  }
}
