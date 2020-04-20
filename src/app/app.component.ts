import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';

import GetSheet from 'get-sheet-done';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  public wins: { [key: string]: number } = {};
  public winPercents: { [key: string]: string } = {};

  public isLoading = true;
  public dataSource = new MatTableDataSource();

  private ssKey = '1yf1kZLdlWCSBdiROvzjIZt2Zay9ec7BzyIbdybI5NE4';
  private ssSheetId = 3;

  public winTypes = ['Points', 'Dominance'];
  public headers = ['Birds', 'Cats', 'Mice', 'Lizards', 'Otters', 'Moles', 'Crows', 'Vagabond1', 'Vagabond2'];
  public expandedHeaders = this.headers.concat(['Vagabond1 Type', 'Vagabond2 Type', 'Experience', 'Rounds', 'Winner', 'Map', 'Winner First', 'Winner Last', 'Keep Clearing', '# Players', 'Deck'])
  public dataSet: any[] = [];
  public currentDataSet: any[] = [];
  public filter: (x) => boolean = (gameData) => true;

  public currentFilter = null;
  public activeFilters = [];

  async ngAfterViewInit() {

    const { data } = await GetSheet.raw(this.ssKey, this.ssSheetId);
    this.isLoading = false;

    this.dataSet = data
      .slice(11)
      .filter(arr => arr.filter(x => x && x.trim()).length > 0)
      .map(arr => arr.reduce((prev, cur, idx) => ({ [this.expandedHeaders[idx]]: cur, ...prev }), {}));

    this.refreshData(0);
    this.recalculateWinPercent();

    setTimeout(() => {
      this.dataSource.sort = this.sort;
    }, 0);
  }

  public changePage($event) {
    this.refreshData($event.pageIndex);
  }

  isWin(result): boolean {
    return result == "WDom" || result == '30';
  }

  public refreshFilters(includeFactions: Array<string>, excludeFactions: Array<string>, winningFaction: string, winType: string) {
    this.filter = (gameData): boolean => {      
        if (!includeFactions.every(f => gameData[f])) 
          return false;
          
        if (excludeFactions.some(f => gameData[f]))
          return false;
        
        if (winningFaction != "Any" && !this.isWin(gameData[winningFaction]))
          return false;

        if (winType == "Dominance" && !Object.values(gameData).find(r => r === 'WDom'))
          return false;
        
        if (winType == "Points" && !Object.values(gameData).find(r => r === '30'))
          return false;

        return true;
    }
  }

  public refreshData(page: number) {
    this.currentDataSet = this.dataSet.filter(this.filter);
    // Should this not be currentDataSet? Hmm.
    this.dataSource.data = this.currentDataSet.slice(page * 25, (page + 1) * 25);
  }

  public updateFilters($includeFactions, $excludeFactions, $winningFaction, $winType) {
    this.refreshFilters($includeFactions.value || [], $excludeFactions.value || [], $winningFaction.value || "Any", $winType.value || "Any");
    this.refreshData(0);
    this.recalculateWinPercent();
  }
  
  public removeFilter(filter) {
    filter = (gameData) => true;
    this.refreshData(0);
    this.recalculateWinPercent();
  }

  public recalculateWinPercent() {
    this.wins = {};
    this.winPercents = {};

    this.headers.forEach(faction => {
      this.wins[faction] = 0;
      this.winPercents[faction] = '0.00';
    });

    this.currentDataSet.forEach(item => {

      this.headers.forEach(faction => {
        if(!item[faction] || item[faction] === 'Dom' || (item[faction] !== 'WDom' && +item[faction] < 30)) return;

        this.wins[faction] = this.wins[faction] || 0;
        this.wins[faction]++;
      });
    });

    this.headers.forEach(faction => {
      this.winPercents[faction] = (this.wins[faction] / this.currentDataSet.length * 100).toFixed(2);
    });
  }
}
