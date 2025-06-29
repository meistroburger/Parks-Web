import { GameStats, Position } from '../types';
import Ride from './Ride';
import { Visitor } from './Visitor';

export interface Staff {
  id: string;
  type: 'handyman' | 'mechanic' | 'security' | 'entertainer';
  name: string;
  salary: number;
  efficiency: number;
  area: string;
  position: Position;
  task: string;
  energy: number;
  happiness: number;
}

export interface Research {
  id: string;
  name: string;
  cost: number;
  duration: number; // in months
  progress: number; // 0-100
  completed: boolean;
  type: 'ride' | 'facility' | 'marketing' | 'efficiency';
}

export interface Facility {
  id: string;
  type: 'shop' | 'restaurant' | 'toilet' | 'first_aid' | 'info_kiosk';
  name: string;
  position: Position;
  cost: number;
  income: number;
  maintenance: number;
  customerCapacity: number;
  currentCustomers: number;
}

export interface ParkObjective {
  id: string;
  description: string;
  type: 'money' | 'visitors' | 'happiness' | 'rides' | 'park_value';
  target: number;
  current: number;
  completed: boolean;
  reward: number;
}

export interface MarketingCampaign {
  id: string;
  type: 'radio' | 'tv' | 'newspaper' | 'online' | 'billboard';
  name: string;
  cost: number;
  duration: number; // in days
  effectiveness: number; // 0-100
  targetAudience: 'families' | 'teens' | 'adults' | 'seniors' | 'all';
  expectedVisitorIncrease: number;
  active: boolean;
  daysRemaining: number;
}

export interface WeatherEvent {
  type: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snow' | 'heatwave';
  intensity: number; // 0-100
  duration: number; // in hours
  visitorMultiplier: number;
  rideAvailabilityMultiplier: number;
  description: string;
}

export interface ParkEvent {
  id: string;
  type: 'celebrity_visit' | 'maintenance_issue' | 'safety_inspection' | 'holiday_bonus' | 'supplier_discount';
  title: string;
  description: string;
  impact: {
    money?: number;
    reputation?: number;
    visitors?: number;
    duration?: number; // in days
  };
  choices?: Array<{
    text: string;
    consequence: {
      money?: number;
      reputation?: number;
      visitors?: number;
    };
  }>;
}

export interface ParkAnalytics {
  dailyVisitors: number[];
  dailyRevenue: number[];
  ridePopularity: Map<string, number>;
  visitorSatisfaction: number[];
  staffEfficiency: number[];
  monthlyProfit: number[];
  seasonalTrends: Map<string, number>;
}

export class Park {
  public name: string;
  public stats: GameStats;
  public rides: Ride[] = [];
  public visitors: Visitor[] = [];
  public staff: Staff[] = [];
  public facilities: Facility[] = [];
  public research: Research[] = [];
  public activeResearch: Research | null = null;
  public objectives: ParkObjective[] = [];
  public size: { width: number; height: number };
  public ticketPrice: number = 15;
  public parkValue: number = 0;
  public weather: 'sunny' | 'cloudy' | 'rainy' | 'snowy' = 'sunny';
  public season: 'spring' | 'summer' | 'fall' | 'winter' = 'fall';
  public marketingCampaigns: MarketingCampaign[] = [];
  public currentWeatherEvent: WeatherEvent | null = null;
  public pendingEvents: ParkEvent[] = [];
  public analytics: ParkAnalytics;
  public reputation: number = 50; // 0-100
  public safetyRating: number = 100; // 0-100
  public cleanlinessRating: number = 100; // 0-100
  public entertainmentRating: number = 50; // 0-100
  public priceStrategy: 'budget' | 'standard' | 'premium' = 'standard';
  private lastUpdateTime: number = 0;
  private gameDate: Date;
  private gameSpeed: number = 1;
  private isPaused: boolean = false;
  private visitorSpawnTimer: number = 0;
  private monthlyExpenses: number = 0;
  private monthlyIncome: number = 0;
  private eventCooldown: number = 0;
  private dailyVisitorTarget: number = 100;

  constructor(name: string = 'My Amazing Park') {
    this.name = name;
    this.stats = {
      money: 50000,
      visitors: 0,
      happiness: 75,
      reputation: 500
    };
    this.size = { width: 100, height: 100 };
    this.gameDate = new Date(1, 9, 1); // October Year 1
    this.lastUpdateTime = Date.now();
    this.analytics = {
      dailyVisitors: [],
      dailyRevenue: [],
      ridePopularity: new Map(),
      visitorSatisfaction: [],
      staffEfficiency: [],
      monthlyProfit: [],
      seasonalTrends: new Map()
    };
    this.initializeObjectives();
    this.initializeStartingFacilities();
    this.initializeResearchTree();
    this.generateWeatherEvent();
  }

  private initializeObjectives(): void {
    this.objectives = [
      {
        id: 'first_1000_visitors',
        description: 'Attract 1,000 visitors to your park',
        type: 'visitors',
        target: 1000,
        current: 0,
        completed: false,
        reward: 5000
      },
      {
        id: 'park_value_100k',
        description: 'Reach a park value of $100,000',
        type: 'park_value',
        target: 100000,
        current: 0,
        completed: false,
        reward: 10000
      },
      {
        id: 'happiness_80',
        description: 'Maintain 80% average guest happiness',
        type: 'happiness',
        target: 80,
        current: 75,
        completed: false,
        reward: 7500
      },
      {
        id: 'five_rides',
        description: 'Build 5 different types of rides',
        type: 'rides',
        target: 5,
        current: 0,
        completed: false,
        reward: 8000
      }
    ];
  }

  private initializeStartingFacilities(): void {
    // Add starting facilities
    this.facilities.push({
      id: 'entrance_shop',
      type: 'shop',
      name: 'Park Entrance Shop',
      position: { x: 0, y: 0, z: -85 },
      cost: 1000,
      income: 150,
      maintenance: 25,
      customerCapacity: 8,
      currentCustomers: 0
    });
  }

  private initializeResearchTree(): void {
    this.research = [
      {
        id: 'better_maintenance',
        name: 'Advanced Maintenance',
        cost: 5000,
        duration: 30, // days
        progress: 0,
        completed: false,
        type: 'efficiency'
      },
      {
        id: 'marketing_boost',
        name: 'Marketing Research',
        cost: 8000,
        duration: 45,
        progress: 0,
        completed: false,
        type: 'marketing'
      },
      {
        id: 'new_ride_tech',
        name: 'Advanced Ride Technology',
        cost: 12000,
        duration: 60,
        progress: 0,
        completed: false,
        type: 'ride'
      },
      {
        id: 'facility_upgrade',
        name: 'Facility Improvements',
        cost: 6000,
        duration: 35,
        progress: 0,
        completed: false,
        type: 'facility'
      }
    ];
  }

  private generateWeatherEvent(): void {
    const weatherTypes: WeatherEvent[] = [
      {
        type: 'sunny',
        intensity: 80,
        duration: 8,
        visitorMultiplier: 1.2,
        rideAvailabilityMultiplier: 1.0,
        description: 'Perfect sunny weather brings more visitors!'
      },
      {
        type: 'cloudy',
        intensity: 50,
        duration: 6,
        visitorMultiplier: 0.9,
        rideAvailabilityMultiplier: 1.0,
        description: 'Cloudy skies with comfortable temperatures'
      },
      {
        type: 'rainy',
        intensity: 70,
        duration: 4,
        visitorMultiplier: 0.4,
        rideAvailabilityMultiplier: 0.6,
        description: 'Heavy rain forces some rides to close'
      },
      {
        type: 'heatwave',
        intensity: 95,
        duration: 12,
        visitorMultiplier: 0.7,
        rideAvailabilityMultiplier: 0.8,
        description: 'Extreme heat makes visitors seek shade'
      }
    ];

    this.currentWeatherEvent = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
  }

  public addRide(ride: Ride): boolean {
    if (this.stats.money >= ride.cost.money) {
      this.stats.money -= ride.cost.money;
      this.rides.push(ride);
      ride.open();
      this.updateReputation(5);
      return true;
    }
    return false;
  }

  public removeRide(rideId: string): boolean {
    const index = this.rides.findIndex(ride => ride.id === rideId);
    if (index !== -1) {
      this.rides.splice(index, 1);
      this.updateReputation(-2);
      return true;
    }
    return false;
  }

  public addVisitor(visitor: Visitor): void {
    this.visitors.push(visitor);
    this.stats.visitors = this.visitors.length;
  }

  public removeVisitor(visitorId: string): void {
    const index = this.visitors.findIndex(v => v.id === visitorId);
    if (index !== -1) {
      this.visitors.splice(index, 1);
      this.stats.visitors = this.visitors.length;
    }
  }

  public update(deltaTime: number): void {
    if (this.isPaused) return;

    const currentTime = Date.now();
    const realDeltaTime = (currentTime - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = currentTime;

    // Update game time (accelerated)
    const gameTimeStep = realDeltaTime * this.gameSpeed * 60; // 1 real second = 1 game minute at normal speed
    this.gameDate = new Date(this.gameDate.getTime() + gameTimeStep * 1000);

    // Update weather and season
    this.updateWeatherAndSeason();

    // Update visitor simulation
    this.updateVisitorSpawn(realDeltaTime * this.gameSpeed);
    this.updateVisitors(realDeltaTime * this.gameSpeed);
    
    // Update rides
    this.updateRides(realDeltaTime * this.gameSpeed);
    
    // Update facilities
    this.updateFacilities(realDeltaTime * this.gameSpeed);
    
    // Update staff
    this.updateStaff(realDeltaTime * this.gameSpeed);
    
    // Update research
    this.updateResearch(realDeltaTime * this.gameSpeed);
    
    // Update park economics
    this.updateEconomics(realDeltaTime * this.gameSpeed);
    
    // Update objectives
    this.updateObjectives();
    
    // Calculate park value
    this.calculateParkValue();
    
    // Random events (very rare)
    if (Math.random() < 0.0001 * realDeltaTime) {
      this.triggerRandomEvent();
    }
  }

  private updateWeatherAndSeason(): void {
    const month = this.gameDate.getMonth();
    
    // Update season
    if (month >= 2 && month <= 4) this.season = 'spring';
    else if (month >= 5 && month <= 7) this.season = 'summer';
    else if (month >= 8 && month <= 10) this.season = 'fall';
    else this.season = 'winter';
    
    // Weather affects visitor spawn rates and happiness
    const weatherRand = Math.random();
    if (this.season === 'summer') {
      this.weather = weatherRand < 0.7 ? 'sunny' : (weatherRand < 0.9 ? 'cloudy' : 'rainy');
    } else if (this.season === 'winter') {
      this.weather = weatherRand < 0.3 ? 'sunny' : (weatherRand < 0.6 ? 'cloudy' : 'snowy');
    } else {
      this.weather = weatherRand < 0.5 ? 'sunny' : (weatherRand < 0.8 ? 'cloudy' : 'rainy');
    }
  }

  private updateVisitorSpawn(deltaTime: number): void {
    this.visitorSpawnTimer += deltaTime;
    
    // Base spawn rate: 1 visitor every 5 seconds
    let spawnRate = 5;
    
    // Weather effects - now using the weather event from WeatherManager
    if (this.currentWeatherEvent) {
      // Apply weather multiplier to spawn rate (lower multiplier = fewer visitors = longer spawn time)
      spawnRate /= this.currentWeatherEvent.visitorMultiplier;
    } else {
      // Fallback to old weather system if WeatherManager isn't active
      if (this.weather === 'rainy') spawnRate *= 1.8;
      else if (this.weather === 'snowy') spawnRate *= 2.2;
      else if (this.weather === 'sunny' && this.season === 'summer') spawnRate *= 0.7;
    }
    
    // Reputation effects
    const reputationMultiplier = Math.max(0.3, this.stats.reputation / 500);
    spawnRate /= reputationMultiplier;
    
    // Marketing campaign effects
    let marketingBoost = 1.0;
    this.marketingCampaigns.forEach(campaign => {
      if (campaign.active) {
        marketingBoost += (campaign.effectiveness / 100) * 0.3; // 30% max boost per campaign
      }
    });
    spawnRate /= marketingBoost;
    
    // Park capacity limits
    const maxVisitors = Math.min(500, this.rides.length * 50 + this.facilities.length * 20);
    if (this.visitors.length >= maxVisitors) spawnRate *= 3;
    
    if (this.visitorSpawnTimer >= spawnRate && this.visitors.length < maxVisitors) {
      this.spawnVisitor();
      this.visitorSpawnTimer = 0;
    }
  }

  private updateEconomics(deltaTime: number): void {
    // Income from rides
    let rideIncome = 0;
    this.rides.forEach(ride => {
      if (ride.isOperational && ride.isOperating) {
        // Consider weather effects on ride operations
        let weatherMultiplier = 1.0;
        if (this.currentWeatherEvent) {
          weatherMultiplier = this.currentWeatherEvent.rideAvailabilityMultiplier;
        }
        
        const actualRidersPerHour = ride.ridersPerHour * weatherMultiplier;
        rideIncome += ride.ticketPrice * actualRidersPerHour * (deltaTime / 3600);
      }
    });

    // Income from facilities (shops, restaurants, etc.)
    let facilityIncome = 0;
    this.facilities.forEach(facility => {
      if (facility.currentCustomers > 0) {
        facilityIncome += facility.income * (deltaTime / 3600);
      }
    });

    // Park entrance fees - based on actual visitors entering
    const entranceFees = this.visitors.length * this.ticketPrice * 0.001 * (deltaTime / 3600);

    // Operating costs
    const staffCosts = this.staff.length * 20 * (deltaTime / 3600); // $20 per staff per hour
    const rideMaintenance = this.rides.length * 3 * (deltaTime / 3600); // $3 per ride per hour
    const facilityMaintenance = this.facilities.length * 1 * (deltaTime / 3600); // $1 per facility per hour
    const utilities = Math.max(50, this.visitors.length * 0.1) * (deltaTime / 3600); // Utilities scale with visitors

    // Apply income and expenses
    const totalIncome = rideIncome + facilityIncome + entranceFees;
    const totalExpenses = staffCosts + rideMaintenance + facilityMaintenance + utilities;
    
    this.stats.money += totalIncome - totalExpenses;
    this.monthlyIncome += totalIncome;
    this.monthlyExpenses += totalExpenses;
    
    // Ensure money doesn't go below 0
    this.stats.money = Math.max(0, this.stats.money);
  }

  private updateVisitors(deltaTime: number): void {
    // Update existing visitors
    this.visitors.forEach(visitor => {
      visitor.update(deltaTime);
    });

    // Remove visitors who are leaving
    this.visitors = this.visitors.filter(visitor => !visitor.isLeaving);
    this.stats.visitors = this.visitors.length;

    // Update happiness based on visitor satisfaction
    if (this.visitors.length > 0) {
      const avgHappiness = this.visitors.reduce((sum, v) => sum + v.happiness, 0) / this.visitors.length;
      this.stats.happiness = Math.round(avgHappiness);
    }
  }

  private updateRides(deltaTime: number): void {
    this.rides.forEach(ride => {
      ride.update(deltaTime);
      
      // Random breakdowns
      if (Math.random() < 0.001 * deltaTime && ride.isOperational) {
        ride.breakdown();
        console.log(`${ride.name} has broken down!`);
      }
    });
  }

  private updateFacilities(deltaTime: number): void {
    this.facilities.forEach(facility => {
      // Update customer flow
      if (facility.currentCustomers < facility.customerCapacity && Math.random() < 0.1 * deltaTime) {
        facility.currentCustomers++;
      }
      
      // Process customers and generate income
      if (facility.currentCustomers > 0 && Math.random() < 0.3 * deltaTime) {
        const income = facility.income * (deltaTime / 3600); // Hourly income
        this.stats.money += income;
        this.monthlyIncome += income;
        facility.currentCustomers--;
      }
      
      // Maintenance costs
      const maintenance = facility.maintenance * (deltaTime / 3600);
      this.stats.money -= maintenance;
      this.monthlyExpenses += maintenance;
    });
  }

  private updateStaff(deltaTime: number): void {
    this.staff.forEach(staff => {
      // Pay salaries (hourly)
      const hourlySalary = staff.salary / (30 * 24); // Monthly salary to hourly
      this.stats.money -= hourlySalary * deltaTime;
      this.monthlyExpenses += hourlySalary * deltaTime;
      
      // Update energy and happiness
      staff.energy = Math.max(0, staff.energy - (deltaTime / 3600) * 5);
      if (staff.energy < 20) {
        staff.efficiency *= 0.9; // Tired staff are less efficient
      }
      
      // Staff happiness affects performance
      if (staff.happiness > 80) {
        staff.efficiency = Math.min(100, staff.efficiency + 0.1 * deltaTime);
      } else if (staff.happiness < 50) {
        staff.efficiency = Math.max(20, staff.efficiency - 0.2 * deltaTime);
      }
      
      // Update task assignment
      this.assignStaffTasks(staff);
    });
  }

  private assignStaffTasks(staff: Staff): void {
    switch (staff.type) {
      case 'handyman':
        staff.task = 'Cleaning paths and facilities';
        break;
      case 'mechanic':
        if (this.rides.some(ride => !ride.isOperational)) {
          staff.task = 'Repairing broken rides';
        } else {
          staff.task = 'Inspecting ride safety';
        }
        break;
      case 'security':
        staff.task = 'Patrolling park areas';
        break;
      case 'entertainer':
        staff.task = 'Entertaining guests';
        break;
    }
  }

  private updateResearch(deltaTime: number): void {
    if (this.activeResearch && !this.activeResearch.completed) {
      // Progress research based on time
      const progressRate = 100 / (this.activeResearch.duration * 30 * 24 * 3600); // Progress per second
      this.activeResearch.progress += progressRate * deltaTime;
      
      if (this.activeResearch.progress >= 100) {
        this.completeResearch(this.activeResearch);
      }
    }
  }

  private completeResearch(research: Research): void {
    research.completed = true;
    research.progress = 100;
    this.activeResearch = null;
    
    // Apply research benefits
    switch (research.type) {
      case 'ride':
        // Unlock new ride types or improve existing ones
        this.rides.forEach(ride => ride.excitement += 0.5);
        break;
      case 'facility':
        // Improve facility efficiency
        this.facilities.forEach(facility => facility.income *= 1.2);
        break;
      case 'marketing':
        // Improve reputation and visitor attraction
        this.updateReputation(20);
        break;
      case 'efficiency':
        // Improve staff efficiency
        this.staff.forEach(staff => staff.efficiency += 10);
        break;
    }
    
    console.log(`Research completed: ${research.name}`);
  }

  private updateObjectives(): void {
    this.objectives.forEach(objective => {
      if (objective.completed) return;
      
      // Update current progress
      switch (objective.type) {
        case 'money':
          objective.current = this.stats.money;
          break;
        case 'visitors':
          objective.current = this.stats.visitors;
          break;
        case 'happiness':
          objective.current = this.stats.happiness;
          break;
        case 'rides':
          objective.current = this.rides.length;
          break;
        case 'park_value':
          objective.current = this.parkValue;
          break;
      }
      
      // Check if completed
      if (objective.current >= objective.target) {
        objective.completed = true;
        this.stats.money += objective.reward;
        console.log(`Objective completed: ${objective.description} - Reward: $${objective.reward}`);
      }
    });
  }

  private calculateParkValue(): void {
    let value = 0;
    
    // Add ride values
    this.rides.forEach(ride => {
      value += ride.cost.money * 0.8; // Rides depreciate to 80% of original cost
    });
    
    // Add facility values
    this.facilities.forEach(facility => {
      value += facility.cost * 0.9; // Facilities depreciate to 90% of original cost
    });
    
    // Add reputation bonus
    value += this.stats.reputation * 10;
    
    // Add visitor happiness bonus
    value += this.stats.happiness * 100;
    
    this.parkValue = Math.floor(value);
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  public setGameSpeed(speed: number): void {
    this.gameSpeed = Math.max(1, Math.min(4, speed));
  }

  public getFormattedDate(): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[this.gameDate.getMonth()]} Year ${this.gameDate.getFullYear()}`;
  }

  public updateReputation(change: number): void {
    this.stats.reputation = Math.max(0, Math.min(1000, this.stats.reputation + change));
  }

  public getFormattedTime(): string {
    const hours = this.gameDate.getHours();
    const minutes = this.gameDate.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  public getStats(): GameStats {
    return { ...this.stats }; // Return a copy to prevent direct modification
  }

  public addStaffMember(staff: any): void {
    // In a full implementation, this would add to a staff array
    console.log('Adding staff member:', staff);
    // For now, just adjust monthly costs
    this.stats.money -= staff.salary; // First month's salary
  }

  public startResearch(researchData: any): void {
    console.log('Starting research:', researchData);
    // In a full implementation, this would add to active research
    // For now, just log the action
  }

  private spawnVisitor(): void {
    const visitor = new Visitor(
      `Guest ${this.visitors.length + 1}`,
      Math.floor(Math.random() * 60) + 10, // Age 10-69
      { x: 0, y: 0, z: -90 } // Start at park entrance
    );
    this.addVisitor(visitor);
  }

  private triggerRandomEvent(): void {
    const events = [
      () => {
        this.stats.money += 1000;
        console.log('Random event: Local newspaper featured your park! +$1000');
      },
      () => {
        this.updateReputation(10);
        console.log('Random event: Celebrity visited your park! +10 reputation');
      },
      () => {
        if (this.rides.length > 0) {
          const ride = this.rides[Math.floor(Math.random() * this.rides.length)];
          ride.breakdown();
          console.log(`Random event: ${ride.name} experienced technical difficulties!`);
        }
      },
      () => {
        // Weather event
        if (this.weather === 'sunny') {
          this.visitorSpawnTimer = 0; // Immediate visitor boost
          console.log('Random event: Perfect weather brings extra visitors!');
        }
      },
      () => {
        // Staff event
        if (this.staff.length > 0) {
          const staff = this.staff[Math.floor(Math.random() * this.staff.length)];
          staff.happiness += 20;
          staff.efficiency += 10;
          console.log(`Random event: ${staff.name} received employee of the month award!`);
        }
      }
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    event();
  }
}