#include <cmath>
#include <random>
#include <vector>
#include <iostream>

using namespace std;
vector <int> results;

const int buffer = 4;
int buffer1, buffer2, buffer3, buffer4, roll1, roll2, roll3, roll4, roll5, sales;

void run_day();
int run_sim();
double CalcAverage(vector<int> nums);

int main() {
    int i;
    for (i = 0; i < 10000; i++){
        results.push_back(run_sim());
    }
    cout << "sim ran " << i << " times" << endl;
    cout << "Values: " << endl;
    for (int j = 0; j < i; j++){
        cout << results[j] << " ";
    }
    cout << endl;
    cout << "Average Value: " << CalcAverage(results) << endl;
}

double CalcAverage(vector<int> nums) {
    if (nums.empty()) {
        return 0;
    }
    return accumulate(nums.begin(), nums.end(), 0) / nums.size();
}

int run_sim(){
    buffer1 = buffer;
    buffer2 = buffer;
    buffer3 = buffer;
    buffer4 = buffer;
    roll1 = 0;
    roll2 = 0;
    roll3 = 0;
    roll4 = 0;
    roll5 = 0;
    sales = 0;
    for (int i = 0; i < 20; i++){
        run_day();
    }
    return sales;
}

void run_day(){
    random_device rd;  // Obtain a random number from hardware
    mt19937 gen(rd()); // Seed the generator

    // Define the distribution for integers between 1 and 6 (inclusive)
    uniform_int_distribution<> dis(3, 4);

    // generate rolls
    roll1 = dis(gen);
    roll2 = dis(gen);
    roll3 = dis(gen);
    roll4 = dis(gen);
    roll5 = dis(gen);

    // shift and check buffers
    buffer1 += roll1;
    buffer2 += min(roll2, buffer1);
    buffer3 += min(roll3, buffer2);
    buffer4 += min(roll4, buffer3);
    sales += min(roll4, buffer3);
}